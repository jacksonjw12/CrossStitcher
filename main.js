const colorThief = new ColorThief();
window.state = {
    image: undefined,
    imageReady: false,
    origin: {},
    grid: {},
    palette: undefined,
}

function debounce(func){
    var timer;
    return function(event){
        if(timer){
            clearTimeout(timer);
        } 
        timer = setTimeout(func,100,event);
    };
}

window.addEventListener("resize",debounce(function(e){
    controlsUpdate();
}));

const colorCodes = [
    "",
    "$",
    "@",
    "B",
    "%",
    "&",
    "M",
    "#",
    "*",
    "Z",
    "0",
    "Q",
    "L",
    "C",
    "J",
    "U",
    "Y",
    "X",
    ")",
    "{",
    "]",
    "?",
    "+",
    "~",
    ">",
    "!",
    "I",
    "^",
]


async function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

function drawPreviews() {
    state.origin = {ratio: 1};
    state.origin.canvas = document.getElementById("previewCanvas");
    state.origin.ctx = state.origin.canvas.getContext("2d");

    let w = state.image.width;
    let h = state.image.height;
    
    const containerDims = document.getElementById("previewContainer").getBoundingClientRect();
   
    if(w >= containerDims.width) {
        state.origin.ratio = w / (containerDims.width- 20);
        w = containerDims.width - 20;
        h /= state.origin.ratio;
    }

    state.origin.canvas.width = w
    state.origin.canvas.height = h
    state.origin.ctx.drawImage(state.image, 0,0, w, h);
    // console.log(state.ctx.getImageData(100, 100, 1, 1));

    updatePalette();


    constructGrid();
}   


function deltaE(rgbA, rgbB) {
    let labA = rgb2lab(rgbA);
    let labB = rgb2lab(rgbB);
    let deltaL = labA[0] - labB[0];
    let deltaA = labA[1] - labB[1];
    let deltaB = labA[2] - labB[2];
    let c1 = Math.sqrt(labA[1] * labA[1] + labA[2] * labA[2]);
    let c2 = Math.sqrt(labB[1] * labB[1] + labB[2] * labB[2]);
    let deltaC = c1 - c2;
    let deltaH = deltaA * deltaA + deltaB * deltaB - deltaC * deltaC;
    deltaH = deltaH < 0 ? 0 : Math.sqrt(deltaH);
    let sc = 1.0 + 0.045 * c1;
    let sh = 1.0 + 0.015 * c1;
    let deltaLKlsl = deltaL / (1.0);
    let deltaCkcsc = deltaC / (sc);
    let deltaHkhsh = deltaH / (sh);
    let i = deltaLKlsl * deltaLKlsl + deltaCkcsc * deltaCkcsc + deltaHkhsh * deltaHkhsh;
    return i < 0 ? 0 : Math.sqrt(i);
  }
  
  function rgb2lab(rgb){
    let r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255, x, y, z;
    r = (r > 0.04045) ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = (g > 0.04045) ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    b = (b > 0.04045) ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
    x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
    y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
    z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
    x = (x > 0.008856) ? Math.pow(x, 1/3) : (7.787 * x) + 16/116;
    y = (y > 0.008856) ? Math.pow(y, 1/3) : (7.787 * y) + 16/116;
    z = (z > 0.008856) ? Math.pow(z, 1/3) : (7.787 * z) + 16/116;
    return [(116 * y) - 16, 500 * (x - y), 200 * (y - z)]
  }


function closestColorInPalette(color) {
    if(!state.palette) {
        return;
    }
    let closest = state.palette[0];
    let closestDist = -1;


    for(let p = 0; p < state.palette.length; p ++) {
        const pal = state.palette[p];
        
        const newDist = deltaE(pal, color);
        if(newDist < closestDist || closestDist < 0) {
            closest = pal;
            closestDist = newDist;
        }
    }


    return closest;

}

function averageColor(imageData) {
    let red = 0;
    let blue = 0;
    let green = 0;
    let pixels = 0;

    for(let i = 0; i < imageData.data.length; i+=4){
        const r = imageData.data[i];
        const g = imageData.data[i+1];
        const b = imageData.data[i+2];
        const a = imageData.data[i+3];

        // May need to do some alpha processing here.
        red += r;
        blue += b
        green += g
        pixels++;
    }

    red /= pixels;
    blue /= pixels;
    green /= pixels;
    return [red,green,blue]


}

function constructGrid() {
    if(!state.palette) {
        return;
    }
    state.grid = {ratio: 1};

    var IMcanvas = document.createElement('canvas');
    var IMcontext = IMcanvas.getContext('2d');
    IMcanvas.width = state.image.width;
    IMcanvas.height = state.image.height;
    IMcontext.drawImage(state.image, 0, 0 );

    state.grid.canvas = document.getElementById("outputCanvas1");
    state.grid.ctx = state.grid.canvas.getContext("2d");

    const size = Number(document.getElementById('grain').value) || 30;


    let outSize = size / state.origin.ratio;
    const w = state.image.width;
    const h = state.image.height;

    const cols = Math.ceil(w / size);
    const rows = Math.ceil(h / size);

    let newWidth = (cols * size) / state.origin.ratio;
    let newHeight = (rows * size) / state.origin.ratio;
    state.grid.canvas.width = newWidth;
    state.grid.canvas.height = newHeight;


    const containerDims = document.getElementById("outputCanvas1").getBoundingClientRect();
   
    if(newWidth >= containerDims.width) {
        state.grid.ratio = newWidth / (containerDims.width);
        newWidth = containerDims.width;
        newHeight /= state.grid.ratio;
        outSize /= state.grid.ratio;
    }

    const grid = []

    for(let r = 0; r< rows; r++) {
        const row = []
        for(let c = 0; c < cols; c++) {
            const xStart = c*size;
            const xEnd = Math.min(xStart + size, w);
            const yStart = r*size;
            const yEnd = Math.min(yStart + size, h);
            const imgData = IMcontext.getImageData(xStart, yStart, xEnd-xStart, yEnd-yStart);

            const color = averageColor(imgData);
            const closestColor = closestColorInPalette(color);
            state.grid.ctx.fillStyle = `rgb(${closestColor[0]}, ${closestColor[1]}, ${closestColor[2]})`;
            state.grid.ctx.fillRect(c*outSize, r*outSize, outSize, outSize);

            row.push({
                color: closestColor
            })

        }
        grid.push(row);
    }
    state.gridColors = grid;

    fillSymbolGrid();

}

function colorKey(color) {
    return `rgb(${color[0]},${color[1]},${color[2]})`;
}

function getSymbolForPaletteColor(color) {
    if(!state.palette || !state.paletteSymbols) {
        return;
    }
    const key = colorKey(color);
    return state.paletteSymbols[key];
}

function fillSymbolGrid() {

    if(!state.gridColors || !state.palette) {
        return;
    }

    const canvas = document.getElementById("finalCanvas");
    const ctx = canvas.getContext("2d");
    const containerDims = document.getElementById("finalContainer").getBoundingClientRect();
    const ratio = containerDims.width / (state.image.width - 20);
    canvas.width = containerDims.width - 20;
    canvas.height = state.image.height * ratio;

    // ctx.fillRect(0,0,canvas.width, canvas.height);



    const gridColors = state.gridColors;
    const size = canvas.width / gridColors[0].length;
    ctx.font = `${size-1}pt Courier`

    for(let r = 0; r< gridColors.length; r++) {
        for(let c = 0; c < gridColors[0].length; c++) {

            if((r == 0 || r == gridColors.length-1) ) {
                const center = gridColors[0].length / 2;
                if (center - Math.floor(center) == 0) {
                    if( c == center || c == center-1) {
                        ctx.fillStyle = "green"
                        ctx.fillRect(size*c, size*r, size, size);
                    }
                }
                else {
                    if( c == Math.floor(center)) {
                        ctx.fillStyle = "green"
                        ctx.fillRect(size*c, size*r, size, size);
                    }
                }
                
            }
            if((c == 0 || c == gridColors[0].length-1) ) {
                const center = gridColors.length / 2;
                if (center - Math.floor(center) == 0) {
                    if( r == center || r == center-1) {
                        ctx.fillStyle = "blue"
                        ctx.fillRect(size*c, size*r, size, size);
                    }
                }
                else {
                    if( r == Math.floor(center)) {
                        ctx.fillStyle = "blue"
                        ctx.fillRect(size*c, size*r, size, size);
                    }
                }
                
            }

            ctx.fillStyle = colorKey(gridColors[r][c].color)
            ctx.strokeRect(size*c, size*r, size, size);

            const color = gridColors[r][c].color;
            const symbol = getSymbolForPaletteColor(color);
            if(symbol) {
                ctx.fillText(symbol, size*c, size*r-1, size)
            }
            
        }
    }


    document.getElementById('paletteKey').innerHTML += `<div>ROWS: ${gridColors.length}</div><div>COLS: ${gridColors[0].length} <div>`


}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}
  

function rgbToHex(rgb) {
    return "#" + componentToHex(rgb[0]) + componentToHex(rgb[1]) + componentToHex(rgb[2]);
}

function lightnessRGB(rgb) {
    const max = Math.max(rgb[0], rgb[1], rgb[2]);
    const min = Math.min(rgb[0], rgb[1], rgb[2]);
    return (max+min)/(2*255);
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


    // Create palette symbols
    const sortedPalette = [...state.palette].sort((color1, color2) => {
       const l1 = lightnessRGB(color1);
       const l2 = lightnessRGB(color2);
       return l2 - l1;
    })

    state.paletteSymbols = [];

    const paletteKey = document.getElementById('paletteKey');
    let inner = `<ul>`

    for(let p = 0; p < sortedPalette.length; p++) {
        const ck = colorKey(sortedPalette[p])

        state.paletteSymbols[ck] = colorCodes[p];

        if(p == 0) {
            continue;
        }
        inner += `<li><div style='display: inline-block; background-color:${ck}; width:15px; height:15px;'></div> ${colorCodes[p]} | ${ck} | ${rgbToHex(sortedPalette[p])} </li>`
        inner += `</br>`
    }


    inner += `</ul>`
    paletteKey.innerHTML = inner;

    


    
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