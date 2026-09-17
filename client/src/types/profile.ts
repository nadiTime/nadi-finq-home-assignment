export interface Profile {
  uuid: string
  picture: { thumbnail: string; large: string }
  name: { title: string; first: string; last: string }
  gender: string
  location: {
    country: string
    city: string
    state: string
    streetNumber: number
    streetName: string
  }
  email: string
  phone: string
  dob: { age: number; year: number }
  isSaved?: boolean
}
