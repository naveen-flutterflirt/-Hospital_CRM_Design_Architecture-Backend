export function validateLeadInput(data) {
  const errors = [];

  if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
    errors.push({ field: 'name', message: 'Lead/Patient name is required' });
  }

  if (!data.treatment || typeof data.treatment !== 'string' || data.treatment.trim() === '') {
    errors.push({ field: 'treatment', message: 'Treatment or enquiry subject is required' });
  }

  if (data.email && typeof data.email === 'string') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email.trim())) {
      errors.push({ field: 'email', message: 'Invalid email address' });
    }
  }

  const validStages = ['new', 'contacted', 'quote', 'visited', 'wonLost'];
  if (data.stage && !validStages.includes(data.stage)) {
    errors.push({
      field: 'stage',
      message: `Stage must be one of: ${validStages.join(', ')}`,
    });
  }

  return errors;
}

export function validateUpdateLeadInput(data) {
  const errors = [];

  if (data.name !== undefined && (typeof data.name !== 'string' || data.name.trim() === '')) {
    errors.push({ field: 'name', message: 'Lead name cannot be empty' });
  }

  const validStages = ['new', 'contacted', 'quote', 'visited', 'wonLost'];
  if (data.stage && !validStages.includes(data.stage)) {
    errors.push({
      field: 'stage',
      message: `Stage must be one of: ${validStages.join(', ')}`,
    });
  }

  return errors;
}
