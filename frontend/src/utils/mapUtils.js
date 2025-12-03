export function formatLatLng(lat, lng){
  return `${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}`;
}