const CURRENT_AMOUNT_OF_DRAWINGS = 63;

const nextImage = () => {
  const currentArtworkImageElement = document.getElementById(
    "currentArtworkImage",
  );
  const currentArtworkImageNumberAsString = currentArtworkImageElement.src
    .split("/")[6]
    .split(".")[0];
  currentArtworkImageElement.src = currentArtworkImageElement.src.replace(
    `${currentArtworkImageNumberAsString}.png`,
    CURRENT_AMOUNT_OF_DRAWINGS > Number(currentArtworkImageNumberAsString)
      ? `${String(Number(currentArtworkImageNumberAsString) + 1)}.png`
      : "1.png",
  );
};

const generateThumbnails = () => {
  const thumbnailsSectionElement = document.getElementById("thumbnails");
  for (let i = 1; i <= CURRENT_AMOUNT_OF_DRAWINGS; i++) {
    const newThumbnailElement = document.createElement("article");
    newThumbnailElement.id = `thumbnail-${i}`;
    newThumbnailElement.onclick = () => showArtwork(i);
    newThumbnailElement.innerHTML = `
    <a href="#${i}" style="text-decoration:inherit;color:inherit"><img id="thumbnail-${i}-artwork" loading="lazy" src="./assets/art/digital/thumbnails/${i}.png" alt="Artwork ${i}" style="width:100%;height:150px;object-fit:cover"</a>
    `;
    thumbnailsSectionElement.appendChild(newThumbnailElement);
  }
};

const showArtwork = (number) => {
  const currentArtworkImageElement = document.getElementById(
    "currentArtworkImage",
  );
  const currentArtworkImageNumberAsString = currentArtworkImageElement.src
    .split("/")[6]
    .split(".")[0];
  currentArtworkImageElement.src = currentArtworkImageElement.src.replace(
    `${currentArtworkImageNumberAsString}.png`,
    `${number}.png`,
  );
  currentArtworkImageElement?.scrollIntoView({behavior: "smooth", block: "center", inline: "center"});
};

document.addEventListener("DOMContentLoaded", () => generateThumbnails());
