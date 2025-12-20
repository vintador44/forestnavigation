import React, { useState } from "react";

import "../styles/ImageCollection.css";

const ImageCollection = ({ maxPreviewWidth = 600,
    previewAspectRatio = 4 / 3,
    previewHeight = 400,
    readOnly = false }) => {
    const [images, setImages] = useState([]);
    const [currentImage, setCurrentImage] = useState(0);

    console.log(readOnly);

    const hasPrevImage = (currentImage - 1) >= 0;
    const hasNextImage = (currentImage + 1) < images.length;

    const overlapLeft = hasPrevImage ? -previewHeight * previewAspectRatio / 2 : 0;
    const overlapRight = hasNextImage ? -previewHeight * previewAspectRatio / 2 : 0;

    const nextImage = () => {
        if (hasNextImage) {
            setCurrentImage(currentImage + 1);
        }
    };

    const prevImage = () => {
        if (hasPrevImage) {
            setCurrentImage(currentImage - 1);
        }
    };

    const addImage = () => {
        setImages(images + [0]);
    };

    const removeImage = () => {
        const imgs = Array.from(images).toSpliced(currentImage, 1);

        if (hasNextImage) {
            nextImage();
        } else if (hasPrevImage) {
            prevImage();
        } else {
            setCurrentImage(0);
        }

        setImages(imgs);
    }

    return (  
        <div className="image-collection-outer">
            <div id="header">
                <h1>Фотографии:</h1>
                { !readOnly && (
                    <button className="control-btn-2" onClick={ (_) => addImage() }>
                        <img src='static/img/plus.png' alt="Добавить" />
                    </button>
                )}
            </div>
            <div className="image-collection" style={{ minHeight: `${previewHeight}px` }}>
                <button className="control-btn" onClick={ (_) => prevImage() }>
                    <img src='static/img/left.png' alt="Назад" />
                </button>
                { (images.length > 0) ? (
                    <div id="image-container">
                    { hasPrevImage && (
                        <img className="image" src='static/img/placeholder.jpg'
                            style={{ aspectRatio: `${previewAspectRatio}`,
                                maxWidth: `${maxPreviewWidth * 0.85}px`,
                                height: `${previewHeight * 0.85}px`,
                                zIndex: "-1",
                                filter: "brightness(75%)"
                            }}
                        alt="Предыдущее изображение" />
                    ) }
                    <div>
                    <img className="image" src='static/img/placeholder.jpg'
                        style={{ marginLeft: `${overlapLeft}px`,
                            marginRight: `${overlapRight}px`,
                            aspectRatio: `${previewAspectRatio}`,
                            maxWidth: `${maxPreviewWidth}px`,
                            height: `${previewHeight}px`,
                            zIndex: "0"
                        }}
                    alt="Текущее изображение" />
                    { !readOnly && (
                        <button className="control-btn-2"
                            style={{ position: "absolute",
                                top: "-5px",
                                right: `${-5 + overlapRight}px`,
                                width: "20px",
                                height: "20px" }}
                            onClick={ (_) => removeImage() }>
                                <img src='static/img/x.png' alt="Удалить" />
                        </button>
                    )}
                    </div>
                    { hasNextImage && (
                        <img className="image" src='static/img/placeholder.jpg'
                            style={{ aspectRatio: `${previewAspectRatio}`,
                            maxWidth: `${maxPreviewWidth * 0.85}px`,
                            height: `${previewHeight * 0.85}px`,
                            zIndex: "-1",
                            filter: "brightness(75%)"
                        }}
                        alt="Следующее изображение" />
                    ) }
                    </div>
                ) : (
                    <div id="image-container">
                        <p>Нет изображений.</p>
                    </div>
                )}

                <button className="control-btn" onClick={(_) => nextImage() }>
                    <img src='static/img/right.png' alt="Вперёд" />
                </button>
            </div>
        </div>
    );
};

export default ImageCollection;