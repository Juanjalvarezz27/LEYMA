/**
 * descargarBlob.ts
 *
 * Función auxiliar para descargar un Blob como archivo en todos los navegadores,
 * incluyendo Chrome móvil (que revoca el blob antes de procesar la descarga) y
 * Safari iOS (que ignora el atributo `download` en enlaces blob programáticos).
 */

function esSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /^((?!chrome|android).)*safari/i.test(ua);
}

export async function descargarBlob(blob: Blob, nombreArchivo: string): Promise<void> {
  if (esSafari()) {
    // Safari no admite link.click() + download con blob URLs.
    // Convertimos el blob a una Data URL base64 y abrimos en nueva pestaña.
    // El usuario puede usar "Guardar como..." desde el visor nativo de Safari.
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onloadend = () => {
        try {
          const dataUrl = reader.result as string;
          const link = document.createElement("a");
          link.href = dataUrl;
          link.download = nombreArchivo;
          link.target = "_blank";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          resolve();
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Chrome, Firefox, y otros navegadores: usar blob URL con revocación diferida
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nombreArchivo;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Revocar DESPUÉS de que el navegador procese la descarga (mínimo 1 segundo)
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
