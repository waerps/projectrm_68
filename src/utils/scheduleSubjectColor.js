// One subject palette for the admin, tutor and student timetables.
export function scheduleSubjectColor(name = '') {
  if (name.includes('คณิต')) return 'bg-orange-500';
  if (name.includes('วิทย์') || name.includes('วิทยา') || name.includes('ฟิสิกส์') || name.includes('เคมี') || name.includes('ชีว')) return 'bg-blue-500';
  if (name.includes('ไทย')) return 'bg-pink-500';
  if (name.includes('สังคม')) return 'bg-amber-600';
  if (name.includes('อังกฤษ')) return 'bg-purple-500';
  if (name.includes('NETSAT') || name.includes('A-Level')) return 'bg-red-500';
  return 'bg-teal-500';
}
