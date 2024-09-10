import { useState } from 'react'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { NextPageBanner } from '../components/NextPageBanner'
import { AdBanner } from '../components/AdBanner'
import { EventList } from '../components/EventList'
import { Props, Event as EventType } from '../props/generated'
import { Filters } from '../organisms/FilterButton'
import axios from 'axios'
import { PrimeReactProvider } from 'primereact/api'
import Tailwind from 'primereact/passthrough/tailwind'

export const Lending = ({ Events, User, MainTag, Tags, Cities }: Props) => {
  const [events, setEvents] = useState(Events)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [filters, setFilters] = useState<Filters>({
    name: '',
    city: '',
    available: false,
    type_of: 'in_person,online',
    tags: [],
  })

  const onFilterChange = async (f: Filters) => {
    setLoading(true)
    setFilters(f)
    setEvents([])

    const e = await requestEvents(0, f)

    setLoading(false)
    setPage(0)
    setEvents(e)
  }

  const onRequestNewPage = async () => {
    setLoading(true)
    const e = await requestEvents(page + 1, filters)

    if (e.length > 0) {
      setPage(page + 1)
      setEvents(events.concat(e))
    }

    setLoading(false)
  }

  return (
    <PrimeReactProvider value={{ unstyled: true, pt: Tailwind }}>
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        <Header
          user={User}
          currentPage={MainTag}
          tags={Tags}
          cities={Cities}
          onFilterChange={onFilterChange}
        />
        <EventList events={events} loading={loading} />

        <NextPageBanner onClick={onRequestNewPage} />

        <AdBanner />

        <Footer />
      </div>
    </PrimeReactProvider>
  )
}

const requestEvents = async (page: number, filters: Filters) => {
  let out: EventType[] = []
  let f: Filters = Object.assign({}, filters)
  f.city = f.city === 'Todas' ? '' : f.city

  try {
    const resp = await axios.get('/api/events', {
      params: { page: page, ...f },
    })
    out = resp.data
  } catch (e) {
    console.log(e)
  } finally {
    return out
  }
}
