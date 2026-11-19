// Build a one-page demo PDF locally. A raster page keeps Cyrillic independent of installed PDF fonts.
export function downloadDocument(type, data) {
  const titles = {
    policy: "Страховой полис ДМС",
    payment: "Поручение на перевод страховой премии",
    offer: "Договор-оферта ДМС",
  };
  const canvas = document.createElement("canvas");
  canvas.width = 1240;
  canvas.height = 1754;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, 1240, 1754);
  ctx.fillStyle = "#ef3124";
  ctx.fillRect(80, 90, 58, 9);
  ctx.font = "28px Arial";
  ctx.fillText("Демонстрационный образец", 80, 164);
  ctx.fillStyle = "#17181c";
  ctx.font = "bold 44px Arial";
  ctx.fillText(titles[type], 80, 282, 1080);
  ctx.font = "30px Arial";
  ctx.fillText("Программа «Пульс здоровья»", 80, 361);
  const money = (n) => new Intl.NumberFormat("ru-RU").format(n) + " ₽";
  const rows =
    type === "offer"
      ? [
          ["Срок страхования", "1 год"],
          ["Возраст сотрудников", "18–65 лет"],
          ["Стоимость за сотрудника", money(16500)],
        ]
      : [
          ["Номер", data.number],
          ["Период страхования", data.start + " — " + data.end],
          ["Количество сотрудников", String(data.count)],
          ["Страховая премия", money(data.amount)],
          ["Счёт списания", "·· " + data.account],
        ];
  rows.forEach(([k, v], i) => {
    const y = 495 + i * 90;
    ctx.font = "26px Arial";
    ctx.fillStyle = "#60626b";
    ctx.fillText(k, 80, y);
    ctx.fillStyle = "#17181c";
    ctx.fillText(v, 620, y);
    ctx.strokeStyle = "#dedfe3";
    ctx.beginPath();
    ctx.moveTo(80, y + 28);
    ctx.lineTo(1160, y + 28);
    ctx.stroke();
  });
  ctx.font = "24px Arial";
  ctx.fillStyle = "#60626b";
  ctx.fillText("Образец для демонстрации клиентского пути.", 80, 1540);
  ctx.fillText("Оформление, подписание и оплата смоделированы.", 80, 1580);
  const bin = atob(canvas.toDataURL("image/jpeg", 0.92).split(",")[1]);
  const jpg = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  const enc = new TextEncoder(),
    parts = [],
    offsets = [0];
  let length = 0;
  const put = (s) => {
    const b = typeof s === "string" ? enc.encode(s) : s;
    parts.push(b);
    length += b.byteLength;
  };
  const obj = (i, s) => {
    offsets[i] = length;
    put(i + " 0 obj\n");
    put(s);
    put("\nendobj\n");
  };
  put("%PDF-1.4\n");
  obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
  obj(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  obj(
    3,
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im 4 0 R >> >> /Contents 5 0 R >>",
  );
  offsets[4] = length;
  put(
    "4 0 obj\n<< /Type /XObject /Subtype /Image /Width 1240 /Height 1754 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " +
      jpg.length +
      " >>\nstream\n",
  );
  put(jpg);
  put("\nendstream\nendobj\n");
  const draw = "q 595 0 0 842 0 0 cm /Im Do Q\n";
  obj(5, "<< /Length " + draw.length + " >>\nstream\n" + draw + "endstream");
  const xref = length;
  put("xref\n0 6\n0000000000 65535 f \n");
  for (const offset of offsets.slice(1))
    put(String(offset).padStart(10, "0") + " 00000 n \n");
  put("trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n" + xref + "\n%%EOF\n");
  const url = URL.createObjectURL(new Blob(parts, { type: "application/pdf" })),
    a = document.createElement("a");
  a.href = url;
  a.download = titles[type] + " — демо.pdf";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
