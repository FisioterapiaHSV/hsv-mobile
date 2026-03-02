// Seguimiento: toggle de actividades
function toggleActivities(btn){
  const list = btn.closest('.note-card').querySelector('.activity-list');
  if(!list) return;
  const visible = list.style.display !== 'none' && list.style.display !== '';
  list.style.display = visible ? 'none' : 'block';
  btn.textContent = visible ? 'Ver actividades realizadas' : 'Ocultar actividades';
}

window.toggleActivities = toggleActivities;
