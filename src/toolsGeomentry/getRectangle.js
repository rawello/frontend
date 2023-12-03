export const geometry = {
  drwRectangle: function (
    ref,
    x = 10,
    y = 10,
    width = 100,
    height = 100,
    type,
    widthLine = 2
  ) {
    //fillRect(x, y, width, height)
    const canvas = ref;
    const ctx = canvas.getContext("2d");
    console.log("arguments",type);
    switch (type) {
      case "stroke": {
        ctx.strokeRect(x, y, width, height);
        return;
      }
      case "fill": {
        ctx.fillRect(x, y, width, height);
        return;
      }
      default:
        console.log("insertType:fill|stroke");
        return;
    }
  },
  drwLine: function (
    ref,
    x1 = 10,
    y1 = 10,
    x2 = 50,
    y2 = 10,
    color = "grey",
    widthLine = 8
  ) {
    console.log("ref",ref)
    const canvas = ref;
    const ctx = canvas.getContext("2d");
     ctx.beginPath();
    // координаты начала линии X,Y
    ctx.moveTo(x1, y1);
    // команда рисования линии с координатами конца линии
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color; //цвет линии
    ctx.lineWidth = widthLine; //толщина линии
    ctx.stroke(); // обводка линии
  },
};
