export function getUsername() {
  const username = sessionStorage.getItem('username')

  if (username) return username

  let newUsername = prompt('Please enter a username', '')

  // If no username entered by user, generate random
  if (!newUsername) {
    const randomNum = Math.floor(Math.random() * 1000)
    newUsername = 'user' + randomNum
  }

  sessionStorage.setItem('username', newUsername)

  return newUsername
}

