// Cetak dengan override @page ke A4 portrait, terlepas dari @page default
// aplikasi - style disisipkan sementara lalu dihapus lagi setelah print.
export function printPortraitA4() {
  const style = document.createElement("style")
  style.textContent = "@page { size: A4 portrait; margin: 15mm 18mm; }"
  document.head.appendChild(style)
  window.print()
  document.head.removeChild(style)
}
