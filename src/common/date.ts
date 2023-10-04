import dayjs from 'dayjs';

export function relative(date: Date, now?: Date): string {
  now = now || new Date();
  const diff = now.getTime() - date.getTime();
  if (diff < 60 * 1000) {
    return 'just now';
  }
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000));
    return `${minutes} ${minutes > 1 ? 'minutes' : 'minute'} ago`;
  }
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    return `${hours} ${hours > 1 ? 'hours' : 'hour'} ago`;
  }
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    return `${days} ${days > 1 ? 'days' : 'day'} ago`;
  }
  return dayjs(date).format('YYYY-MM-DD');
}
