
import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import "../styles/ImageCollection.css";

const ImageCollection = forwardRef(({
  uploadHandler,
  maxPreviewWidth = 600,
  previewAspectRatio = 4 / 3,
  previewHeight = 400,
  readOnly = false,
  images: externalImages = [],
}, ref) => {
  const [internalImages, setInternalImages] = useState([]);
  const [currentImage, setCurrentImage] = useState(0);

  const displayedImages = readOnly ? externalImages : internalImages;

  useImperativeHandle(ref, () => ({
    getFiles: () => internalImages.map(img => img.file).filter(Boolean),
    clear: () => setInternalImages([])
  }), [internalImages]);

  useEffect(() => {
    return () => {
      displayedImages.forEach(img => {
        if (img.url && img.url.startsWith('blob:')) {
          URL.revokeObjectURL(img.url);
        }
      });
    };
  }, [displayedImages]);

  const hasPrevImage = currentImage - 1 >= 0;
  const hasNextImage = currentImage + 1 < displayedImages.length;

  const overlapLeft = hasPrevImage ? -(previewHeight * previewAspectRatio) / 2 : 0;
  const overlapRight = hasNextImage ? -(previewHeight * previewAspectRatio) / 2 : 0;

  const nextImage = () => { if (hasNextImage) setCurrentImage(p => p + 1); };
  const prevImage = () => { if (hasPrevImage) setCurrentImage(p => p - 1); };

  const addImage = () => {
    if (readOnly) return;
    const newIndex = internalImages.length;
    uploadHandler?.(newIndex, (file) => {
      if (file) {
        const url = URL.createObjectURL(file);
        setInternalImages(prev => [...prev, { url, file }]);
        setCurrentImage(internalImages.length);
      }
    });
  };

  const removeImage = () => {
    if (readOnly) return;
    setInternalImages(prev => {
      const newImages = prev.filter((_, i) => i !== currentImage);
      if (newImages.length === 0) {
        setCurrentImage(0);
      } else if (currentImage >= newImages.length) {
        setCurrentImage(newImages.length - 1);
      }
      return newImages;
    });
  };

  const handleImageClick = () => {
    if (readOnly) return;
    uploadHandler?.(currentImage, (file) => {
      if (file) {
        const url = URL.createObjectURL(file);
        setInternalImages(prev =>
          prev.map((img, i) => i === currentImage ? { url, file } : img)
        );
      }
    });
  };

  const getPreviewUrl = (index) => {
    return displayedImages[index]?.url || "static/img/placeholder.jpg";
  };

  return (
    <div className="image-collection-outer">
      <div id="header">
        <h1>Фотографии:</h1>
        {!readOnly && (
          <button
            type="button"
            onClick={addImage}
            className="create-location-button"
          >
            Добавить фото
          </button>
        )}
      </div>

      <div
        className="image-collection"
        style={{ minHeight: `${previewHeight}px` }}
      >
        <button
          className="control-btn"
          onClick={prevImage}
          disabled={!hasPrevImage}
          aria-label="Предыдущее изображение"
        >
          <img src="static/img/left.png" alt="Назад" />
        </button>

        {displayedImages.length > 0 ? (
          <div id="image-container">
            {hasPrevImage && (
              <img
                className="image"
                src={getPreviewUrl(currentImage - 1)}
                style={{
                  aspectRatio: `${previewAspectRatio}`,
                  maxWidth: `${maxPreviewWidth * 0.85}px`,
                  height: `${previewHeight * 0.85}px`,
                  zIndex: "-1",
                  filter: "brightness(75%) blur(1px)",
                }}
                alt="Предыдущее изображение"
              />
            )}

            <div style={{ position: "relative", zIndex: "0" }}>
              <img
                className="image"
                src={getPreviewUrl(currentImage)}
                style={{
                  marginLeft: `${overlapLeft}px`,
                  marginRight: `${overlapRight}px`,
                  aspectRatio: `${previewAspectRatio}`,
                  maxWidth: `${maxPreviewWidth}px`,
                  height: `${previewHeight}px`,
                  cursor: readOnly ? "default" : "pointer",
                }}
                onClick={handleImageClick}
                alt="Текущее изображение"
              />
              {!readOnly && (
                <button
                  className="control-btn-2"
                  style={{
                    position: "absolute",
                    top: "-5px",
                    right: `${-5 + overlapRight}px`,
                    width: "20px",
                    height: "20px",
                    zIndex: "1",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage();
                  }}
                  aria-label="Удалить изображение"
                >
                  <img src="static/img/x.png" alt="Удалить" />
                </button>
              )}
            </div>

            {hasNextImage && (
              <img
                className="image"
                src={getPreviewUrl(currentImage + 1)}
                style={{
                  aspectRatio: `${previewAspectRatio}`,
                  maxWidth: `${maxPreviewWidth * 0.85}px`,
                  height: `${previewHeight * 0.85}px`,
                  zIndex: "-1",
                  filter: "brightness(75%) blur(1px)",
                }}
                alt="Следующее изображение"
              />
            )}
          </div>
        ) : (
          <div id="image-container">
            <p>Нет изображений.</p>
          </div>
        )}

        <button
          className="control-btn"
          onClick={nextImage}
          disabled={!hasNextImage}
          aria-label="Следующее изображение"
        >
          <img src="static/img/right.png" alt="Вперёд" />
        </button>
      </div>
    </div>
  );
});

export default ImageCollection;