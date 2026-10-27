import { Component, computed, input } from '@angular/core';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Days after which an open request is shown as "getting old" / "old"
const AGING_AFTER_DAYS = 3;
const OLD_AFTER_DAYS = 7;

// "Open for N days" label for a request that is still Open.
// It shows nothing for any other status. The number is worked out from the created date,
// so no API call is needed.
@Component({
  selector: 'app-open-age',
  standalone: true,
  templateUrl: './open-age.html',
  styleUrl: './open-age.css'
})
export class OpenAgeComponent {

  status = input<string | null | undefined>();
  createdDate = input<string | null | undefined>();

  // true = short text for table rows ("3 days"), false = full text ("Open for 3 days")
  compact = input(false);

  // Whole days the request has been open, or null when it is not an Open request
  readonly days = computed<number | null>(() => {

    if (this.status() !== 'Open') {
      return null;
    }

    const raw = this.createdDate();

    if (!raw) {
      return null;
    }

    // The API sends UTC times without a "Z", so add it; keep only milliseconds
    const hasZone = /(?:z|[+-]\d{2}:?\d{2})$/i.test(raw);
    const iso = (hasZone ? raw : raw + 'Z').replace(/(\.\d{3})\d+/, '$1');

    const created = new Date(iso).getTime();

    if (Number.isNaN(created)) {
      return null;
    }

    return Math.max(0, Math.floor((Date.now() - created) / MS_PER_DAY));
  });

  readonly level = computed<'fresh' | 'aging' | 'old'>(() => {

    const days = this.days() ?? 0;

    if (days >= OLD_AFTER_DAYS) {
      return 'old';
    }

    return days >= AGING_AFTER_DAYS ? 'aging' : 'fresh';
  });

  // Full sentence (also used as the tooltip)
  readonly fullText = computed(() => {

    const days = this.days();

    if (days === null) {
      return '';
    }

    if (days === 0) {
      return 'Opened today';
    }

    return `Open for ${days} ${days === 1 ? 'day' : 'days'}`;
  });

  readonly label = computed(() => {

    const days = this.days();

    if (days === null) {
      return '';
    }

    if (!this.compact()) {
      return this.fullText();
    }

    if (days === 0) {
      return 'Today';
    }

    return `${days} ${days === 1 ? 'day' : 'days'}`;
  });
}