using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace APP.Models.Entities
{
    public class Request
    {
        public int RequestId { get; set; }

        public string RequestCode { get; set; } = string.Empty;

        public string RequestType { get; set; } = string.Empty;

        public string RequestDescription { get; set; } = string.Empty;

        public string Priority { get; set; } = string.Empty;

        public string Status { get; set; } = string.Empty;

        public DateTime CreatedDate { get; set; }

        public DateTime? UpdatedDate { get; set; }
    }
}
