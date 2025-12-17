import { useParams } from 'react-router-dom'

const ServiceDetail = () => {
  const { slug } = useParams()

  return (
    <section>
      <h1>Service Detail</h1>
      <p>Placeholder page for service: <strong>{slug}</strong></p>
      <p>Later we’ll load info for each service type from the API.</p>
    </section>
  )
}

export default ServiceDetail

