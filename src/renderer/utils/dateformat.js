import dayjs from 'dayjs'

export default (date, format = 'YYYY-MM-DD HH:mm:ss') => {
  if (!date) {
    return '-'
  }
  return dayjs(date).format(format)
}
