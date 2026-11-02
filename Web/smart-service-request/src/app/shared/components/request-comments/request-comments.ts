import { Component, DestroyRef, OnInit, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { AiService } from '../../../core/services/ai.service';
import { AuthService } from '../../../core/services/auth.service';
import { CommentService } from '../../../core/services/comment.service';
import { ReplyDraftIntent } from '../../../core/models/ai.model';
import { RequestComment } from '../../../core/models/comment.model';
import { VALIDATION } from '../../../core/validation/validation-rules';
import { getFieldError, requiredText } from '../../../core/validation/validators';

// Comment list + add form for one request. Used on the Admin, Technician
// and Employee request pages. Who may read or write is decided by the API.
@Component({
    selector: 'app-request-comments',
    standalone: true,
    imports: [DatePipe, ReactiveFormsModule],
    templateUrl: './request-comments.html',
    styleUrl: './request-comments.css'
})
export class RequestCommentsComponent implements OnInit {

    private readonly commentService = inject(CommentService);
    private readonly authService = inject(AuthService);
    private readonly aiService = inject(AiService);
    private readonly destroyRef = inject(DestroyRef);

    requestId = input.required<number>();

    readonly maxLength = VALIDATION.comment.max;
    readonly fieldError = getFieldError;

    comments = signal<RequestComment[]>([]);

    isLoading = signal(true);
    isPosting = signal(false);
    loadError = signal('');
    postError = signal('');
    charCount = signal(0);

    commentControl = new FormControl('', {
        nonNullable: true,
        validators: [requiredText, Validators.maxLength(VALIDATION.comment.max)]
    });

    // ---------- AI reply draft (Admin and Technician only) ----------
    // The draft is never posted by itself: the person clicks "Use this draft",
    // edits the text in the box, and then clicks "Add Comment" as usual.

    readonly canDraft = this.authService.isAdmin() || this.authService.isTechnician();

    readonly aiHint =
        'The AI reads this request\'s description, status history and comments, and writes a short draft. ' +
        'You can edit it before you post. People are shown by role only.';

    readonly draftOptions: { intent: ReplyDraftIntent; label: string }[] = [
        { intent: 'progress', label: 'Progress update' },
        { intent: 'info', label: 'Ask for details' },
        { intent: 'resolved', label: 'Fix confirmation' }
    ];

    aiEnabled = signal(false);
    draftLoading = signal(false);
    draftIntent = signal<ReplyDraftIntent | null>(null);
    draft = signal('');
    draftNote = signal('');
    draftError = signal('');

    ngOnInit(): void {
        this.loadComments();

        // Any problem here simply means "AI off": the comment box stays exactly as it was
        if (this.canDraft) {
            this.aiService
                .isEnabled()
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe(enabled => this.aiEnabled.set(enabled));
        }
    }

    private loadComments(): void {

        this.isLoading.set(true);
        this.loadError.set('');

        this.commentService.getComments(this.requestId()).subscribe({

            next: response => {

                this.isLoading.set(false);

                if (!response.success || !response.data) {
                    this.loadError.set(response.message || 'Unable to load comments.');
                    return;
                }

                this.comments.set(response.data);
            },

            error: error => {
                this.isLoading.set(false);
                console.error(error);
                this.loadError.set(error?.error?.message || 'Unable to load comments.');
            }
        });
    }

    isOwn(comment: RequestComment): boolean {
        const current = this.authService.getUsername() ?? '';
        return comment.username.toLowerCase() === current.toLowerCase();
    }

    // Asks the AI for a draft. Nothing is posted and the comment box is not touched.
    requestDraft(intent: ReplyDraftIntent): void {

        if (this.draftLoading()) {
            return;
        }

        this.draftLoading.set(true);
        this.draftIntent.set(intent);
        this.draft.set('');
        this.draftNote.set('');
        this.draftError.set('');

        this.aiService
            .draftReply(this.requestId(), intent)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({

                next: response => {

                    this.draftLoading.set(false);
                    this.draftIntent.set(null);

                    if (!response.success || !response.data) {
                        this.draftError.set(response.message || 'The draft is not available right now.');
                        return;
                    }

                    if (!response.data.aiUsed) {
                        this.draftNote.set(response.data.note);
                        return;
                    }

                    this.draft.set(response.data.draft);
                },

                error: error => {

                    this.draftLoading.set(false);
                    this.draftIntent.set(null);

                    this.draftError.set(
                        error?.status === 429
                            ? 'Too many AI requests. Please wait a minute and try again.'
                            : error?.error?.message || 'The draft is not available right now.'
                    );
                }
            });
    }

    // Copies the draft into the comment box so it can be edited. Text already in the
    // box is kept: the draft goes after it, with a blank line in between.
    useDraft(): void {

        const text = this.draft();

        if (!text) {
            return;
        }

        const current = this.commentControl.value.trim();
        const combined = current ? `${current}\n\n${text}` : text;

        if (combined.length > this.maxLength) {
            this.draftError.set(
                'The draft does not fit after the text already in the box. Clear the box or shorten it first.'
            );
            return;
        }

        this.draftError.set('');
        this.commentControl.setValue(combined);
        this.commentControl.markAsDirty();
        this.charCount.set(combined.length);
        this.draft.set('');
    }

    dismissDraft(): void {
        this.draft.set('');
        this.draftNote.set('');
        this.draftError.set('');
    }

    postComment(): void {

        this.postError.set('');
        if (this.isPosting()) {
            return;
        }

        if (this.commentControl.invalid) {
            this.commentControl.markAsTouched();
            return;
        }

        this.isPosting.set(true);

        this.commentService
            .addComment(this.requestId(), this.commentControl.value.trim())
            .subscribe({

                next: response => {

                    this.isPosting.set(false);

                    if (!response.success || !response.data) {
                        this.postError.set(response.message || 'Unable to add the comment.');
                        return;
                    }

                    const added = response.data;

                    this.comments.update(list => [...list, added]);
                    this.commentControl.reset('');
                    this.charCount.set(0);
                },

                error: error => {

                    this.isPosting.set(false);
                    console.error(error);
                    this.postError.set(error?.error?.message || 'Unable to add the comment.');
                }
            });
    }
}