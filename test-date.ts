const today = new Date();
const baseDate = today.getDate() - 6;
const days = Array.from({ length: 7 }).map((_, index) => {
    const d = new Date(today);
    d.setDate(baseDate + index);
    return {
        dStr: d.toISOString().split('T')[0],
        label: d.toLocaleDateString('es-ES', { weekday: 'short' })
    };
});
console.log(days);
