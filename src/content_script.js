import {
  differenceInSeconds,
  differenceInMinutes,
  differenceInHours,
} from 'date-fns'
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  const focusedElement = document.activeElement
  if (
    focusedElement &&
    (focusedElement.tagName === 'TEXTAREA' ||
      focusedElement.tagName === 'INPUT')
  ) {
    if (focusedElement.classList.contains('TextInput-Input')) {
      const newText = request.textToInject
      focusedElement.value += '\n' + newText
      focusedElement.dispatchEvent(
        new Event('input', {
          bubbles: true,
        }),
      )
    } else {
      focusedElement.value = request.textToInject
      focusedElement.dispatchEvent(
        new Event('input', {
          bubbles: true,
        }),
      )
    }
  } else {
    const textarea = document.querySelector('textarea')
    if (textarea) {
      if (textarea.classList.contains('TextInput-Input')) {
        const newText = request.textToInject
        textarea.value += '\n' + newText
        textarea.dispatchEvent(
          new Event('input', {
            bubbles: true,
          }),
        )
      } else {
        textarea.value = request.textToInject
        textarea.dispatchEvent(
          new Event('input', {
            bubbles: true,
          }),
        )
        textarea.focus()
      }
    }
  }
})
const createNoteListContainer = (notes) => {
  // Create a <div> element to hold the list of notes
  const focusedElement = document.activeElement
  const noteListContainer = document.createElement('ul')
  noteListContainer.style.backgroundColor = 'white'
  noteListContainer.style.Color = 'black'
  noteListContainer.classList.add('note-list-container')
  noteListContainer.style.position = 'absolute'
  noteListContainer.style.zIndex = 9999
  noteListContainer.style.padding = '10px'
  noteListContainer.style.boxShadow = '0 3px 10px 0 rgba(0,0,0,.2)'
  noteListContainer.style.borderRadius = '10px'
  noteListContainer.style.listStyle = 'none'
  noteListContainer.style.paddingLeft = '0'
  noteListContainer.style.maxHeight = '180px'
  noteListContainer.style.width = `${focusedElement.clientWidth}px`
  noteListContainer.style.marginTop = '10px'
  noteListContainer.style.overflowY = 'auto'
  noteListContainer.style.overflowX = 'hidden'

  // Add the notes to the note list container
  notes.forEach((note) => {
    const noteItem = document.createElement('li')
    const noteTitle = document.createElement('h4')
    const noteBody = document.createElement('p')
    noteTitle.style.fontWeight = 'bolder'
    noteTitle.style.fontSize = '16px'
    noteTitle.style.color = 'black'
    noteBody.style.color = 'black'
    noteItem.style.minHeight = '60px'
    noteItem.style.cursor = 'pointer'
    noteItem.style.width = '100%'
    noteItem.style.background = '#fff'
    noteItem.style.borderBottom = '1px solid rgba(0,0,0,.15)'
    noteItem.style.margin = '0 5px'
    noteItem.style.padding = '0 5px'
    noteItem.style.borderRadius = '3px'
    noteItem.addEventListener('mouseenter', () => {
      noteItem.style.background = '#f5f7f9'
    })
    noteItem.addEventListener('mouseleave', () => {
      noteItem.style.background = '#fff'
    })
    noteItem.addEventListener('click', () => {
      onClickInsert(note.text)
    })
    noteTitle.textContent = note.title
    noteBody.textContent = note.text
    noteItem.appendChild(noteTitle)
    noteItem.appendChild(noteBody)
    noteListContainer.appendChild(noteItem)
  })
  const distanceToBottom = getDistanceToBottomOfScreen(focusedElement)

  // Calculate the position based on the page height and focused element position
  const containerTop =
    distanceToBottom > 150 ? focusedElement.clientHeight + 20 : -180
  noteListContainer.style.top = `${containerTop}px`

  // Add the note list container to the document body
  focusedElement.parentNode.appendChild(noteListContainer)
}
function getDistanceToBottomOfScreen(focusedElement) {
  // Get the bounding rectangle of the active element relative to the viewport
  const elementRect = focusedElement.getBoundingClientRect()

  // Get the viewport height
  const viewportHeight =
    window.innerHeight || document.documentElement.clientHeight

  // Calculate the distance from the bottom of the active element to the bottom of the screen
  const distanceToBottom = viewportHeight - elementRect.bottom
  return distanceToBottom
}
let Notes // Declare the Notes variable outside the function to make it accessible globally
let SecondContact
let FirstContact

const RenderNotesList = async (event) => {
  const focusedElement = document.activeElement
  if (focusedElement.parentNode.className.includes('ant-dropdown-trigger')) {
    return
  }
  const checkElement = document.querySelector('.note-list-container')
  if (checkElement) {
    checkElement.remove()
  }
  const result = await chrome.storage.local.get(['AdvancedMode', 'Notes'])
  if (result.AdvancedMode) {
    Notes = result.Notes
    const input = focusedElement.value
    if (input.includes('/')) {
      const parts = input.split('/') // Split the string into an array using "/"
      const valueAfterLastSlash = parts[parts.length - 1]

      const matchingNotes = valueAfterLastSlash
        ? Notes.filter((oldNote) => {
            return oldNote.title
              .toUpperCase()
              .startsWith(valueAfterLastSlash.toUpperCase())
          })
        : []
      if (matchingNotes.length > 0) {
        createNoteListContainer(matchingNotes)
      } else {
        if (checkElement) {
          checkElement.remove()
        }
      }
    }
  }
}

const handleKeyboardInput = async (event) => {
  if (document.activeElement) {
    if (
      event.key === 'ArrowDown' ||
      event.key === 'Enter' ||
      event.keyCode === 13
    ) {
      handleEnterInput(event)
    } else {
      RenderNotesList(event)
    }
  }
}
const handleEnterInput = (event) => {
  const focusedElement = document.activeElement
  const checkElement = document.querySelector('.note-list-container')

  if (checkElement) {
    event.preventDefault()
    const parts = focusedElement.value.split('/') // Split the string into an array using "/"
    const valueAfterLastSlash = parts[parts.length - 1]
    const modifiedString = focusedElement.value.replace(
      `/${valueAfterLastSlash}`,
      '',
    )

    focusedElement.value =
      modifiedString + ' ' + checkElement.querySelector('li p').innerHTML
    focusedElement.dispatchEvent(
      new Event('input', {
        bubbles: true,
      }),
    )
    checkElement.parentNode.removeChild(checkElement)
  }
}
const findNearestTextAreaOrInput = (element) => {
  let sibling = element.nextElementSibling

  // Loop through the next siblings
  while (sibling) {
    // Check if the sibling is a textarea or input element
    if (sibling.tagName === 'TEXTAREA' || sibling.tagName === 'INPUT') {
      return sibling
    }
    sibling = sibling.nextElementSibling
  }

  // If no textarea or input element found, start checking the previous siblings
  sibling = element.previousElementSibling

  // Loop through the previous siblings
  while (sibling) {
    // Check if the sibling is a textarea or input element
    if (sibling.tagName === 'TEXTAREA' || sibling.tagName === 'INPUT') {
      return sibling
    }
    sibling = sibling.previousElementSibling
  }

  // If no textarea or input element found in both directions, return null
  return null
}

const onClickInsert = (Note) => {
  const checkElement = document.querySelector('.note-list-container')
  const textareaOrInput = findNearestTextAreaOrInput(checkElement)

  if (textareaOrInput) {
    const parts = textareaOrInput.value.split('/') // Split the string into an array using "/"
    const valueAfterLastSlash = parts[parts.length - 1]
    const modifiedString = textareaOrInput.value.replace(
      `/${valueAfterLastSlash}`,
      '',
    )
    textareaOrInput.value = modifiedString + ' ' + Note
    textareaOrInput.dispatchEvent(
      new Event('input', {
        bubbles: true,
      }),
    )
    textareaOrInput.focus()
  }
  checkElement.remove()
}

document.addEventListener('keydown', handleKeyboardInput, true)

// TIMER
// let timeConsumed = null
// let diffSeconds = null
// let countDown = 3600 - diffSeconds
// let startDate = 0
// let didTimerUpdated = false
// function formatTime(seconds) {
//   const minutes = Math.floor(seconds / 60)
//   const remainingSeconds = seconds % 60
//   return `${String(minutes).padStart(2, '0')}:${String(
//     remainingSeconds,
//   ).padStart(2, '0')}`
// }
// async function updateTimer() {
//   const logNumbers = () => {
//     console.log(
//       `timeConsumed:${timeConsumed} \n countDown:${countDown}  \n didTimerUpdated:${didTimerUpdated}\n  diffSeconds:${diffSeconds}  `,
//     )
//   }
//   const CurrentDate = new Date()

//   const result = await chrome.storage.local.get(['BreakTimer'])
//   if (!result.BreakTimer) {
//     const header = document.querySelector(
//       '.ant-layout-header.headerContainer-0-2-5',
//     )
//     const checkElement = header.querySelector('#countdown-timer')
//     if (checkElement) {
//       header.removeChild(checkElement)
//     }
//     return
//   }

//   const header = document.querySelector(
//     '.ant-layout-header.headerContainer-0-2-5',
//   )
//   const checkElement = header.querySelector('#countdown-timer')
//   if (header) {
//     if (!checkElement) {
//       const timerSpan = document.createElement('span')
//       timerSpan.id = 'countdown-timer'
//       timerSpan.textContent = `Break time Left:${formatTime(countDown)} mins`
//       header.appendChild(timerSpan)
//     }
//   }

//   const srcElement = document.querySelector('.ant-badge-status-text')
//   if (srcElement) {
//     const src = srcElement.textContent
//     const formattedTime = formatTime(countDown)
//     if (countDown === 0) {
//       clearInterval(timerInterval)
//     } else {
//       if (src === 'Lunch' || src === 'Short Break') {
//         if (!didTimerUpdated) {
//           didTimerUpdated = true
//           startDate = new Date() // Set StartDate to the current date and time
//         }

//         diffSeconds = differenceInSeconds(CurrentDate, startDate)

//         countDown = 3600 - diffSeconds
//       } else {
//         diffSeconds = 0
//         didTimerUpdated = false
//         startDate = null
//       }

//       if (header) {
//         if (checkElement) {
//           checkElement.textContent = `Break time Left:${formattedTime} mins`
//         }
//       }
//     }
//     logNumbers()
//   } else {
//     // Handle the case where the element is not found
//     console.log('.ant-badge-status-text not found')
//   }
// }

// const timerInterval = setInterval(updateTimer, 1000) // Update timer every second
