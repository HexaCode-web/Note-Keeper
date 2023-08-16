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
const RenderNotesList = async () => {
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
    const matchingNotes = input
      ? Notes.filter((oldNote) => {
          return oldNote.title.toUpperCase().startsWith(input.toUpperCase())
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

const handleKeyboardInput = async (event) => {
  if (
    event.key === 'ArrowDown' ||
    event.key === 'Enter' ||
    event.keyCode === 13
  ) {
    handleEnterInput(event)
  } else {
    RenderNotesList()
  }
}
const handleEnterInput = (event) => {
  const focusedElement = document.activeElement
  const checkElement = document.querySelector('.note-list-container')

  if (checkElement) {
    event.preventDefault()
    focusedElement.value = checkElement.querySelector('li p').innerHTML
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
    textareaOrInput.value = Note
    textareaOrInput.dispatchEvent(
      new Event('input', {
        bubbles: true,
      }),
    )
    textareaOrInput.focus()
  }
  checkElement.remove()
}
document.activeElement.addEventListener('keydown', handleKeyboardInput, true)