import { Component, OnInit, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from '../../../core/services/auth.service';
import { CommentService } from '../../../core/services/comment.service';
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

    ngOnInit(): void {
        this.loadComments();
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