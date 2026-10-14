import {
    Component,
    DestroyRef,
    computed,
    inject,
    input,
    output,
    signal
} from '@angular/core';

import { ListFilters } from '../../../core/models/paged.model';

@Component({
    selector: 'app-list-filter-bar',
    standalone: true,
    templateUrl: './list-filter-bar.html',
    styleUrl: './list-filter-bar.css'
})
export class ListFilterBarComponent {

    placeholder = input('Search...');
    statuses = input<string[]>([]);
    priorities = input<string[]>([]);

    statusLabel = input('All statuses');
    priorityLabel = input('All priorities');

    // Emits the full set of filters whenever one of them changes
    changed = output<ListFilters>();

    search = signal('');
    status = signal('');
    priority = signal('');

    hasFilters = computed(
        () => !!this.search().trim() || !!this.status() || !!this.priority()
    );

    private timer: ReturnType<typeof setTimeout> | null = null;

    constructor() {
        inject(DestroyRef).onDestroy(() => this.clearTimer());
    }

    // Wait until the user stops typing, so we do not call the API on every key
    onSearchInput(value: string): void {
        this.search.set(value);
        this.clearTimer();
        this.timer = setTimeout(() => this.emit(), 400);
    }

    onStatusChange(value: string): void {
        this.status.set(value);
        this.emitNow();
    }

    onPriorityChange(value: string): void {
        this.priority.set(value);
        this.emitNow();
    }

    clear(): void {
        this.search.set('');
        this.status.set('');
        this.priority.set('');
        this.emitNow();
    }

    private emitNow(): void {
        this.clearTimer();
        this.emit();
    }

    private emit(): void {
        this.changed.emit({
            search: this.search().trim(),
            status: this.status(),
            priority: this.priority()
        });
    }

    private clearTimer(): void {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }
}