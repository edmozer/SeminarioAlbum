export function uid(prefix: string): string {
  const value = Math.random().toString(16).slice(2, 8)
  return `${prefix}-${value}-${Date.now().toString(16).slice(-5)}`
}

export function formatDate(iso: string): string {
  const date = new Date(iso)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function onlyFirstName(fullName: string): string {
  return fullName.trim().split(' ')[0] ?? fullName
}

export function emailToPersonName(email: string): { firstName: string; lastName: string } {
  const local = email.split('@')[0] ?? ''
  const words = local
    .replace(/[._-]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))

  if (words.length === 0) {
    return { firstName: 'Novo', lastName: 'Aluno' }
  }

  if (words.length === 1) {
    return { firstName: words[0], lastName: 'Aluno' }
  }

  return { firstName: words[0], lastName: words.slice(1).join(' ') }
}
