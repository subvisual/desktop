import { FC } from 'react'
import { Activity } from '../typings'
import dayjs from 'dayjs'
import WarningIcon from 'src/assets/img/icons/warning.svg?react'
import JobIcon from 'src/assets/img/icons/job.svg?react'

const dateTimeFormat = new Intl.DateTimeFormat(window.navigator.language, {
  hour: 'numeric', minute: 'numeric', second: 'numeric'
})

const ActivityLogItem: FC<Activity> = (activity) => {
  const time = dateTimeFormat.format(new Date(activity.timestamp))

  return (
    <div className="flex py-4 border-b border-grayscale-300 activity-item">
      <div className="w-10">
        {activity.type === 'info' &&
          <i><JobIcon className="btn-icon-primary-small icon-primary" /></i>}
        {activity.type === 'error' &&
          <i><WarningIcon className="btn-icon-primary-small icon-error" /></i>}
      </div>
      <div className="flex-1 mr-4 text-body-s">
        <p>{activity.message}</p>
      </div>
      <div className="">
        <span className='number text-body-2xs text-grayscale-600'>{time}</span>
      </div>
    </div>
  )
}

interface DateSeparatorProps {
  date: string;
}

const DateSeparator: FC<DateSeparatorProps> = ({ date }) => {
  const today = dayjs().format('YYYY-MM-DD')
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD')
  const displayStr = date === today ? 'today' : date === yesterday ? 'yesterday' : dayjs(date).format('D MMM')

  return <div className="uppercase text-body-3xs mb-4">{displayStr}</div>
}

interface ActivitiesByDate {
  [date: string]: Activity[];
}
interface ActivityLogProps {
  activities: Activity[];
}

const ActivityLog: FC<ActivityLogProps> = ({ activities = [] }) => {
  const activitiesByDate: ActivitiesByDate =
    activities
      .sort((x, y) => y.timestamp.getTime() - x.timestamp.getTime())
      .reduce((groups: ActivitiesByDate, activity: Activity) => {
        const date = dayjs(activity.timestamp).format('YYYY-MM-DD')
        return { ...groups, [date]: groups[date] ? groups[date].concat(activity) : [activity] }
      }, {})

  return (
    <div className='activity-log'>
      {Object.entries(activitiesByDate).map(([date, activities]) => (
        <div key={date} className="mb-12">
          <DateSeparator date={date} />
          <div>
            {activities.map((activity) => (
              <ActivityLogItem
                key={activity.id}
                id={activity.id}
                timestamp={activity.timestamp}
                type={activity.type}
                source={activity.source}
                message={activity.message}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default ActivityLog
