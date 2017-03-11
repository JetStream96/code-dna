function getCtx() {
    return document.getElementById("myCanvas").getContext("2d");
}

function drawCircularSector(ctx, x, y, outerR, innerR, angleStart, angleEnd, fillStyle) {
    ctx.beginPath()
    ctx.arc(x, y, outerR, angleStart, angleEnd, false);
    ctx.arc(x, y, innerR,  angleEnd, angleStart,true);
    ctx.fillStyle = fillStyle
    ctx.fill();
}
