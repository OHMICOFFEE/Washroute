export interface CustomerProfile {
  id:              string
  first_name:      string
  last_name:       string
  id_number:       string
  id_type:         'sa_id' | 'passport' | 'other'
  cell:            string
  alt_cell:        string
  email:           string
  street_address:  string
  suburb:          string
  city:            string
  province:        string
  postal_code:     string
  country:         string
  created_at:      string
  credit_balance:  number
  notes:           string
}
