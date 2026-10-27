using System.Text;
using APP.Common.Models;
using APP.Models.DTOs.Requests;

namespace APP.Business.Services
{
    // Builds the CSV file for "Export" (Admin): every request that matches the current
    // filters and sort order, not only the page that is on screen.
    public class RequestExportService
    {
        // Most rows one export may contain (keeps the server and Excel responsive)
        public const int MaxRows = 5000;

        // The list procedure never returns more than 100 rows per page
        private const int PageSize = 100;

        private readonly RequestService _requestService;

        public RequestExportService(RequestService requestService)
        {
            _requestService = requestService;
        }

        public async Task<ApiResponse<byte[]>> BuildCsvAsync(RequestListQueryDto query)
        {
            // Same filters and sort as the list; paging is ours
            var filters = new RequestListQueryDto
            {
                Search = query.Search,
                Status = query.Status,
                Priority = query.Priority,
                SortBy = query.SortBy,
                SortDir = query.SortDir,
                PageNumber = 1,
                PageSize = PageSize
            };

            var first = await _requestService.GetRequestsPagedAsync(filters);

            if (!first.Success || first.Data == null)
            {
                return Fail(first.Message);
            }

            if (first.Data.TotalCount > MaxRows)
            {
                return Fail(
                    $"{first.Data.TotalCount} requests match the filters. " +
                    $"Narrow the filters to {MaxRows} or fewer and export again.");
            }

            var rows = new List<RequestResponseDto>(first.Data.Items);

            for (int page = 2; page <= first.Data.TotalPages; page++)
            {
                filters.PageNumber = page;

                var next = await _requestService.GetRequestsPagedAsync(filters);

                if (!next.Success || next.Data == null)
                {
                    return Fail(next.Message);
                }

                rows.AddRange(next.Data.Items);
            }

            var csv = new StringBuilder();

            AppendRow(csv,
                "Request ID", "Type", "Description", "Priority", "Status",
                "Created (UTC)", "Last Updated (UTC)");

            foreach (var row in rows)
            {
                AppendRow(csv,
                    row.RequestCode,
                    row.RequestType,
                    row.RequestDescription,
                    row.Priority,
                    row.Status,
                    FormatDate(row.CreatedDate),
                    row.UpdatedDate.HasValue ? FormatDate(row.UpdatedDate.Value) : string.Empty);
            }

            // UTF-8 with a byte order mark, so Excel shows non-English text correctly
            byte[] preamble = Encoding.UTF8.GetPreamble();
            byte[] body = Encoding.UTF8.GetBytes(csv.ToString());

            byte[] bytes = new byte[preamble.Length + body.Length];
            Buffer.BlockCopy(preamble, 0, bytes, 0, preamble.Length);
            Buffer.BlockCopy(body, 0, bytes, preamble.Length, body.Length);

            return new ApiResponse<byte[]>
            {
                Success = true,
                Message = $"{rows.Count} requests exported.",
                Data = bytes
            };
        }

        private static ApiResponse<byte[]> Fail(string message)
        {
            return new ApiResponse<byte[]>
            {
                Success = false,
                Message = string.IsNullOrWhiteSpace(message) ? "Unable to export requests." : message,
                Data = null
            };
        }

        // Dates are stored in UTC
        private static string FormatDate(DateTime value)
        {
            return value.ToString("yyyy-MM-dd HH:mm:ss");
        }

        private static void AppendRow(StringBuilder csv, params string?[] cells)
        {
            csv.Append(string.Join(",", cells.Select(Escape)));
            csv.Append("\r\n");
        }

        private static string Escape(string? value)
        {
            if (string.IsNullOrEmpty(value))
            {
                return string.Empty;
            }

            // Spreadsheet formula protection: Excel would run a cell that starts with
            // = + - @ (or a tab / carriage return), so it is turned into plain text
            if ("=+-@\t\r".IndexOf(value[0]) >= 0)
            {
                value = "'" + value;
            }

            bool needsQuotes = value.IndexOfAny(new[] { ',', '"', '\r', '\n' }) >= 0;

            if (!needsQuotes)
            {
                return value;
            }

            return "\"" + value.Replace("\"", "\"\"") + "\"";
        }
    }
}