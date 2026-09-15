import { useState } from 'react';
import { Destination, Photo } from '../types';
import { id } from '../utils';
import { putPhoto, deletePhoto } from '../storage';
import {
  IconUpload,
  IconClose,
  IconCamera,
} from '../icons';

// Client-side guardrails on uploads. These are UX/abuse-prevention only —
// the real security boundary is Supabase Storage (bucket file-size limit +
// allowed MIME types) and RLS, which enforce the same rules server-side.
// See supabase/migrations/0002_hardening.sql.
const MAX_PHOTO_BYTES = 16 * 1024 * 1024; // 16 MB per photo
const MAX_PHOTOS_PER_DESTINATION = 120;
const MAX_CAPTION_LENGTH = 140;

function getFileError(file: File): string | null {
  if (!file.type.startsWith('image/')) {
    return `${file.name} is not an image. Please select a photo.`;
  }

  if (file.size <= 0) {
    return `${file.name} is empty and cannot be uploaded.`;
  }

  if (file.size > MAX_PHOTO_BYTES) {
    return `${file.name} is too large. Maximum size is 16 MB.`;
  }

  return null;
}

export default function GalleryModal({
  dest,
  close,
  update,
  openLightbox,
}: {
  dest: Destination;
  close: () => void;
  update: (d: Destination) => void;
  openLightbox: (p: Photo[], i: number) => void;
}) {
  const [uploadError, setUploadError] =
    useState<string | null>(null);

  const add = (files: FileList | null) => {
    if (!files) return;

    setUploadError(null);

    const remainingSlots = Math.max(
      0,
      MAX_PHOTOS_PER_DESTINATION -
        dest.photos.length
    );

    const incoming = [...files];

    const accepted: File[] = [];
    const errors: string[] = [];

    for (const file of incoming) {
      if (
        accepted.length >=
        remainingSlots
      ) {
        errors.push(
          `${file.name}: maximum of ${MAX_PHOTOS_PER_DESTINATION} photos per destination.`
        );
        continue;
      }

      const error = getFileError(file);

      if (error) {
        errors.push(error);
        continue;
      }

      accepted.push(file);
    }

    if (errors.length > 0) {
      setUploadError(
        errors.join(' ')
      );
    }

    if (accepted.length === 0) {
      return;
    }

    Promise.all(
      accepted.map(
        file =>
          new Promise<Photo>(
            (resolve, reject) => {
              const reader =
                new FileReader();

              reader.onload = () =>
                resolve({
                  id: id(),
                  dataUrl:
                    String(
                      reader.result
                    ),
                  caption:
                    file.name.slice(
                      0,
                      MAX_CAPTION_LENGTH
                    ),
                });

              reader.onerror = () =>
                reject(
                  reader.error
                );

              reader.readAsDataURL(
                file
              );
            }
          )
      )
    )
      .then(photos => {
        photos.forEach(putPhoto);

        update({
          ...dest,
          photos: [
            ...dest.photos,
            ...photos,
          ],
        });
      })
      .catch(() => {
        setUploadError(
          'Could not read one of the selected files. Please try again.'
        );
      });
  };

  return (
    <div
      className="overlay active"
      onMouseDown={e =>
        e.target === e.currentTarget &&
        close()
      }
    >
      <div className="modal modal-wide">
        <div className="modal-header">
          <h2>
            Photos · {dest.name}
          </h2>

          <button
            className="modal-close"
            aria-label="Close"
            onClick={close}
          >
            <IconClose size={18} />
          </button>
        </div>

        <div className="modal-body">
          <label className="upload-zone">
            <div className="upload-icon-badge">
              <IconUpload />
            </div>

            <div className="upload-text">
              Click to upload photos
            </div>

            <div className="upload-subtext">
              or drag your images here
            </div>

            <input
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={e => {
                add(e.target.files);
                e.target.value = '';
              }}
            />
          </label>

          {uploadError && (
            <p
              className="auth-error"
              role="alert"
            >
              {uploadError}
            </p>
          )}

          {dest.photos.length === 0 ? (
            <div className="empty-inline">
              <IconCamera
                size={26}
                className="empty-inline-icon"
              />

              <p>
                No photos yet for{' '}
                {dest.name}.
              </p>
            </div>
          ) : (
            <>
              <p className="gallery-count">
                {dest.photos.length}{' '}
                photo
                {dest.photos.length !==
                1
                  ? 's'
                  : ''}
              </p>

              <div className="gallery-grid">
                {dest.photos.map(
                  (photo, index) => (
                    <div
                      className="gallery-item"
                      key={photo.id}
                    >
                      <div className="thumb-wrap">
                        <img
                          src={
                            photo.dataUrl
                          }
                          onClick={() =>
                            openLightbox(
                              dest.photos,
                              index
                            )
                          }
                          alt={
                            photo.caption ||
                            dest.name
                          }
                        />

                        <button
                          className="del-photo"
                          aria-label="Delete photo"
                          onClick={() => {
                            if (
                              !confirm(
                                "Delete this photo? This can't be undone."
                              )
                            ) {
                              return;
                            }

                            deletePhoto(
                              photo.id
                            );

                            update({
                              ...dest,
                              photos:
                                dest.photos.filter(
                                  p =>
                                    p.id !==
                                    photo.id
                                ),
                            });
                          }}
                        >
                          <IconClose size={12} />
                        </button>
                      </div>

                      <input
                        className="caption-input"
                        value={
                          photo.caption
                        }
                        placeholder="Add a caption…"
                        maxLength={
                          MAX_CAPTION_LENGTH
                        }
                        onChange={e =>
                          update({
                            ...dest,
                            photos:
                              dest.photos.map(
                                p =>
                                  p.id ===
                                  photo.id
                                    ? {
                                        ...p,
                                        caption:
                                          e.target.value.slice(
                                            0,
                                            MAX_CAPTION_LENGTH
                                          ),
                                      }
                                    : p
                              ),
                          })
                        }
                      />
                    </div>
                  )
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}