const colorThief = new ColorThief();
window.state = {
    image: undefined,
    imageReady: false,
    canvas: undefined,
    ctx: undefined,
    palette: undefined,
    paletteReady: false
}


async function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

function drawPreviews() {
    state.canvas = document.getElementById("previewCanvas");
    state.ctx = state.canvas.getContext("2d");

    let w = state.image.width;
    let h = state.image.height;
    
    const containerDims = document.getElementById("previewContainer").getBoundingClientRect();
   
    if(w >= containerDims.width) {
        const ratio = w / (containerDims.width- 20);
        w = containerDims.width - 20;
        h /= ratio;
    }

    state.canvas.width = w
    state.canvas.height = h
    state.ctx.drawImage(state.image, 0,0, w, h);
    console.log(state.ctx.getImageData(100, 100, 1, 1));

    updatePalette();
    
    
}   

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}
  

function rgbToHex(rgb) {
    return "#" + componentToHex(rgb[0]) + componentToHex(rgb[1]) + componentToHex(rgb[2]);
}

function updatePalette() {
    const numColors = Number(document.getElementById('colors').value) || 4;

    state.palette = colorThief.getPalette(state.image, numColors);
    
    const colorBox = document.getElementById('colorBox');
    colorBox.innerHTML = '';

    for(colorIndex in state.palette) {
        const col = document.createElement('div');
        const color = state.palette[colorIndex];
        col.setAttribute('style', `background-color: rgb(${color[0]}, ${color[1]}, ${color[2]})`);
        col.classList.add('colorSample');

        col.setAttribute('title', `RGB(${color[0]}, ${color[1]}, ${color[2]})\n HEX: ${rgbToHex(color)}`)
        colorBox.appendChild(col);
    }

    
}

async function selectImage() {
    const inputImage = document.getElementById('inputImage');
    console.log(inputImage.files)
    const base64 = await toBase64(inputImage.files[0]);
    const src = base64;

    state.imageReady = false;

    state.image = new Image();
    state.image.onload = function () {
        drawPreviews();
        state.imageReady = true;
    }
    state.image.src = src;
}

function controlsUpdate() {
    if(!state.imageReady) {
        return;
    }

    drawPreviews();
}