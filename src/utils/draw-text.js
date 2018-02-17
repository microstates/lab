var greekLetterNames = [
  'Alpha',
  'Beta',
  'Gamma',
  'Delta',
  'Epsilon',
  'Zeta',
  'Eta',
  'Theta',
  'Iota',
  'Kappa',
  'Lambda',
  'Mu',
  'Nu',
  'Xi',
  'Omicron',
  'Pi',
  'Rho',
  'Sigma',
  'Tau',
  'Upsilon',
  'Phi',
  'Chi',
  'Psi',
  'Omega'
];

function convertLatexShortcuts(text) {
  // html greek characters
  for (let i = 0; i < greekLetterNames.length; i++) {
    let name = greekLetterNames[i];
    text = text.replace(
      new RegExp('\\\\' + name, 'g'),
      String.fromCharCode(913 + i + (i > 16))
    );
    text = text.replace(
      new RegExp('\\\\' + name.toLowerCase(), 'g'),
      String.fromCharCode(945 + i + (i > 16))
    );
  }

  // subscripts
  for (let i = 0; i < 10; i++) {
    text = text.replace(
      new RegExp('_' + i, 'g'),
      String.fromCharCode(8320 + i)
    );
  }

  return text;
}

export default function drawText(
  c,
  originalText,
  x,
  y,
  angleOrNull,
  { isSelected, isCaretVisible } = {}
) {
  let text = convertLatexShortcuts(originalText);
  c.font = '20px "Times New Roman", serif';
  var width = c.measureText(text).width;

  // center the text
  x -= width / 2;

  // position the text intelligently if given an angle
  if (angleOrNull) {
    var cos = Math.cos(angleOrNull);
    var sin = Math.sin(angleOrNull);
    var cornerPointX = (width / 2 + 5) * (cos > 0 ? 1 : -1);
    var cornerPointY = (10 + 5) * (sin > 0 ? 1 : -1);
    var slide =
      sin * Math.pow(Math.abs(sin), 40) * cornerPointX -
      cos * Math.pow(Math.abs(cos), 10) * cornerPointY;
    x += cornerPointX - sin * slide;
    y += cornerPointY + cos * slide;
  }

  // draw text and caret (round the coordinates so the caret falls on a pixel)
  if ('advancedFillText' in c) {
    c.advancedFillText(text, originalText, x + width / 2, y, angleOrNull);
  } else {
    x = Math.round(x);
    y = Math.round(y);
    c.fillText(text, x, y + 6);
    if (isSelected && isCaretVisible) {
      x += width;
      c.beginPath();
      c.moveTo(x, y - 10);
      c.lineTo(x, y + 10);
      c.stroke();
    }
  }
}
