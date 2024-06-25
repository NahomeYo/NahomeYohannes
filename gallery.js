window.onload = () => {
    const columns = document.querySelectorAll('.columnContainer .column .columnOverlap .col');

    columns.forEach(col => {
        const colImages = col.querySelectorAll('li');
        colImages.forEach((img) => {
            img.addEventListener('mouseenter', () => {
                imgHover(img, col);
            });
            img.addEventListener('mouseleave', () => {
                imgLeave(img, col);
            });
        });
    });

    function imgHover(img, col) {
        img.classList.add('imgHover');
        col.style.animationPlayState = "paused";
    }

    function imgLeave(img, col) {
        img.classList.remove('imgHover');
        col.style.animationPlayState = "running";
    }
};
