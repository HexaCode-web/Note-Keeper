import React, { useEffect, useState } from 'react'
import { GETDOC, SETDOC } from '../../background'
import { CreateToast } from './App'
export default function Main() {
  const [settings, setSettings] = useState({
    SearchInText: JSON.parse(localStorage.getItem('TextSearch')),
    DCCopy: JSON.parse(localStorage.getItem('DoubleClick')),
    InsertText: JSON.parse(localStorage.getItem('InsertText')),
    AdvancedMode: JSON.parse(localStorage.getItem('AdvancedMode')),
    BreakTimer: JSON.parse(localStorage.getItem('BreakTimer')),
  })
  const [ShowNewNote, setShowNewNote] = React.useState(false)
  const [searching, setSearching] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState('')
  const [hoveredNoteId, setHoveredNoteId] = React.useState(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [syncError, setSyncError] = useState(false)
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }
  const handleNoteHover = (note) => {
    setHoveredNoteId(note.id)
  }
  const handleNoteHoverEnd = () => {
    setHoveredNoteId(null)
  }
  const [NewNote, setNewNote] = React.useState(
    JSON.parse(localStorage.getItem('NewNote')) || {
      pinned: false,
      title: '',
      text: '',
      id: generateId(),
    },
  )
  const [User, setUser] = React.useState(
    JSON.parse(localStorage.getItem('ActiveUser')) || {},
  )
  useEffect(() => {
    const LastLogin = async () => {
      const FetchedUser = await GETDOC('Users', User.ID)
      const lastLogin = JSON.parse(localStorage.getItem('LoginTime'))
      const FetchedNotes = FetchedUser.Notes
      const targetTime = new Date(lastLogin)
      const currentTime = new Date()

      const timeDifference = currentTime - targetTime // Difference in milliseconds
      const hoursDifference = timeDifference / (1000 * 60 * 60) // Convert to hours

      return { Hours: hoursDifference >= 12, FetchedNotes: FetchedNotes }
    }

    LastLogin().then((res) => {
      if (NOTES && res.FetchedNotes.length === NOTES.length) {
        setSyncError(false)
      } else {
        setSyncError(true)
      }
      if (res.Hours) {
        alert('اعد تسجيل الدخول')

        logout()
      }
    })
  }, [])
  useEffect(() => {
    const fixSyncError = async () => {
      if (syncError) {
        CreateToast('...خطاء مزامنة, جاري الاصلاح', 'error', 2000)
        await updateUser(User)
        CreateToast('.تم الاصلاح', 'success', 2000)
      }
    }
    fixSyncError()
  }, [syncError])
  const [NOTES, setNotes] = React.useState(
    JSON.parse(localStorage.getItem('ActiveUser')).Notes || [],
  )

  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target

    if (name === 'TextSearch') {
      setSettings((prev) => ({ ...prev, SearchInText: checked }))
      localStorage.setItem('TextSearch', checked)
    } else if (name === 'DoubleClick') {
      setSettings((prev) => ({ ...prev, DCCopy: checked }))
      localStorage.setItem('DoubleClick', checked)
    } else if (name === 'InsertText') {
      setSettings((prev) => ({ ...prev, InsertText: checked }))
      localStorage.setItem('InsertText', checked)
      window.location.reload()
    } else if (name === 'AdvancedMode') {
      setSettings((prev) => ({ ...prev, AdvancedMode: checked }))
      localStorage.setItem('AdvancedMode', checked)
      chrome.storage.local.set({ AdvancedMode: checked })
    } else if (name === 'BreakTimer') {
      setSettings((prev) => ({ ...prev, BreakTimer: checked }))
      localStorage.setItem('BreakTimer', checked)
      chrome.storage.local.set({ BreakTimer: checked })
    }
  }
  const handleInput = (event) => {
    const { name, value } = event.target
    setNewNote((prev) => {
      return { ...prev, [name]: value }
    })
  }
  const SaveNewNote = async () => {
    const Notes = User.Notes
    const pinnedNotes = Notes.filter((oldNote) => oldNote.pinned)
    const unpinnedNotes = Notes.filter((oldNote) => !oldNote.pinned)
    Notes.length = 0
    Notes.push(...pinnedNotes, NewNote, ...unpinnedNotes)

    setNotes(Notes)
    setUser((prev) => {
      return { ...prev, Notes }
    })
    setShowNewNote(false)
    await updateUser(User)
    CreateToast('تم عمل الملاحظة', 'success')
    setNewNote({
      pinned: false,
      title: '',
      text: '',
      id: generateId(),
    })
  }
  function generateId() {
    let id = ''
    const digits = '0123456789'
    for (let i = 0; i < 5; i++) {
      const randomIndex = Math.floor(Math.random() * digits.length)
      id += digits[randomIndex]
    }
    return id
  }
  const logout = () => {
    localStorage.removeItem('ActiveUser')
    localStorage.removeItem('NewNote')
    chrome.storage.local.set({ AdvancedMode: false })
    window.location.reload()
  }
  const Search = (event) => {
    setSearching(false)
    let SearchValue = event.target.value
    setSearchValue(event.target.value)
    if (SearchValue === ' ') {
      setNotes(User.Notes)
    }
    const Notes = User.Notes
    const filteredNotes = settings.SearchInText
      ? Notes.filter((oldNote) => {
          return (
            oldNote.title.toUpperCase().startsWith(SearchValue.toUpperCase()) ||
            oldNote.text.toUpperCase().startsWith(SearchValue.toUpperCase())
          )
        })
      : Notes.filter((oldNote) => {
          return oldNote.title
            .toUpperCase()
            .startsWith(SearchValue.toUpperCase())
        })
    if (filteredNotes.length > 0) {
      setNotes(filteredNotes)
    } else {
      setSearching(true)
    }
  }
  const reOrder = async (note) => {
    let TempUser = JSON.parse(localStorage.getItem('ActiveUser'))
    const targetNote = TempUser.Notes.find((oldNote) => oldNote.id === note.id)
    const updatedNotes = TempUser.Notes.filter(
      (oldNote) => oldNote.id !== targetNote.id,
    )
    updatedNotes.unshift(note)
    const pinnedNotes = updatedNotes.filter((oldNote) => oldNote.pinned)
    const unpinnedNotes = updatedNotes.filter((oldNote) => !oldNote.pinned)
    updatedNotes.length = 0
    updatedNotes.push(...pinnedNotes, ...unpinnedNotes)
    const updatedTempUser = {
      ...TempUser,
      Notes: updatedNotes,
    }
    await updateUser(updatedTempUser)
    CreateToast('تم اعادة ترتيب الملاحظات', 'success')
  }
  const deleteActiveNote = async (note) => {
    setDeleting(true)
    //fetch user form localstorage
    let TempUser = JSON.parse(localStorage.getItem('ActiveUser'))
    //find the needed user in local storage
    const targetNote = TempUser.Notes.find((oldNote) => {
      return oldNote.id === note.id
    })
    TempUser.Notes.splice(TempUser.Notes.indexOf(targetNote), 1)
    await updateUser(TempUser)
    CreateToast('تم حذف الملاحظة', 'success')
    setDeleting(false)
  }
  const SaveActiveNote = async (note) => {
    let TempUser = JSON.parse(localStorage.getItem('ActiveUser'))

    const updatedNotes = TempUser.Notes.map((oldNote) => {
      if (oldNote.id === note.id) {
        return {
          ...note,
        } // Ensure the edited note remains pinned
      }

      return oldNote
    })
    const pinnedNotes = updatedNotes.filter((oldNote) => oldNote.pinned)
    const unpinnedNotes = updatedNotes.filter((oldNote) => !oldNote.pinned)
    const sortedNotes = [...pinnedNotes, ...unpinnedNotes]

    TempUser.Notes = sortedNotes
    setNotes(sortedNotes)
    await updateUser(TempUser)
    CreateToast('تم حفظ الملاحظة', 'success')
  }

  React.useEffect(() => {
    localStorage.setItem('NewNote', JSON.stringify(NewNote))
  }, [NewNote])
  const updateUser = async (targetUser) => {
    const User = targetUser
    chrome.storage.local.set({ Notes: User.Notes })

    localStorage.setItem('ActiveUser', JSON.stringify(User))
    setNotes(User.Notes)
    await SETDOC('Users', User.ID, {
      ...User,
    })
    setUser(User)
  }
  React.useEffect(() => {
    function handleKeyPress(event) {
      if (event.keyCode === 13 && !event.shiftKey) {
        const textToInject = NOTES[0].text
        navigator.clipboard.writeText(textToInject)
        if (!settings.InsertText) {
          chrome.tabs.query(
            {
              active: true,
              currentWindow: true,
            },
            function (tabs) {
              chrome.tabs.sendMessage(tabs[0].id)
            },
          )
          window.close()
          return
        } else {
          chrome.tabs.query(
            {
              active: true,
              currentWindow: true,
            },
            function (tabs) {
              chrome.tabs.sendMessage(tabs[0].id, {
                textToInject,
              })
            },
          )
          window.close()
        }
      }
    }
    document.addEventListener('keydown', handleKeyPress)
    return () => {
      document.removeEventListener('keydown', handleKeyPress)
    }
  }, [searchValue])

  const ChangePin = async (Note) => {
    let ResultText = Note.pinned
      ? 'تم الغاء تثبيت الملاحظة'
      : 'تم تثبيت الملاحظة'
    let ResortNotes = JSON.parse(localStorage.getItem('ActiveUser')).Notes.map(
      (note) => {
        if (note.id === Note.id) {
          return {
            ...note,
            pinned: !note.pinned,
          }
        }
        return note
      },
    )
    let sortedNotes = [...ResortNotes].sort((a, b) => {
      if (a.pinned === b.pinned) {
        return 0
      } else if (a.pinned) {
        return -1
      } else {
        return 1
      }
    })
    setNotes(sortedNotes)
    let TempUser = JSON.parse(localStorage.getItem('ActiveUser'))
    let UserToSend = {
      ...TempUser,
      Notes: sortedNotes,
    }
    await updateUser(UserToSend)
    CreateToast(ResultText, 'success')
  }
  const copyText = (text, source) => {
    if (source === 'icon') {
      navigator.clipboard.writeText(text)

      window.close()
    } else {
      if (settings.DCCopy) {
        const textToInject = text
        navigator.clipboard.writeText(textToInject)
        if (!settings.InsertText) {
          chrome.tabs.query(
            {
              active: true,
              currentWindow: true,
            },
            function (tabs) {
              chrome.tabs.sendMessage(tabs[0].id)
            },
          )
          window.close()
          return
        } else {
          chrome.tabs.query(
            {
              active: true,
              currentWindow: true,
            },
            function (tabs) {
              chrome.tabs.sendMessage(tabs[0].id, {
                textToInject,
              })
            },
          )
          window.close()
        }
      }
    }
  }
  return (
    <div className="container">
      <div className="Info">
        <p>{User.UserName}</p>
        <input
          onChange={() => {
            Search(event)
          }}
          type="text"
          id="Search"
          placeholder="search"
          autoFocus
        />
        <div className="dropdown-container CheckContainer">
          <img
            src={'../../icons/settings.png'}
            className="Icon"
            onClick={toggleDropdown}
          />
          <div
            className={`dropdown-content ${isDropdownOpen ? 'open' : 'closed'}`}
          >
            <label className="CheckWrapper" title="اضافة الكلام في الموقع">
              <input
                type="checkbox"
                checked={settings.InsertText}
                name="InsertText"
                onChange={handleCheckboxChange}
              />
              Add Text on copy
            </label>
            <label className="CheckWrapper" title="دبل كليك لنسخ الملاحظة">
              <input
                type="checkbox"
                checked={settings.DCCopy}
                name="DoubleClick"
                onChange={handleCheckboxChange}
              />
              Double click to copy
            </label>
            <label className="CheckWrapper" title="بحث داخل الملاحظة">
              <input
                type="checkbox"
                checked={settings.SearchInText}
                name="TextSearch"
                onChange={handleCheckboxChange}
              />
              search in text
            </label>
            <label className="CheckWrapper" title="اسلوب فريش شات">
              <input
                type="checkbox"
                checked={settings.AdvancedMode}
                name="AdvancedMode"
                onChange={handleCheckboxChange}
              />
              FreshChat Mode (BETA)
            </label>
            <label className="CheckWrapper" title="عداد البريكات">
              <input
                type="checkbox"
                checked={settings.BreakTimer}
                name="BreakTimer"
                onChange={handleCheckboxChange}
              />
              Breaks Timer
            </label>
          </div>
        </div>
        <img
          src={'../../icons/logout.png'}
          className="Icon"
          onClick={logout}
        ></img>
      </div>

      {searching && <span className="error">no note found </span>}
      <div style={{ display: 'flex' }}>
        {ShowNewNote && (
          <button
            title="حفظ"
            className="bn632-hover bn24"
            style={{ marginTop: '55px' }}
            onClick={SaveNewNote}
          >
            Save note
          </button>
        )}
        <button
          title={ShowNewNote ? 'الغاء' : 'اضافة'}
          type="button"
          className="bn632-hover bn24"
          style={{ marginTop: '55px' }}
          onClick={() => {
            setShowNewNote((prev) => !prev)
          }}
        >
          {ShowNewNote ? 'Cancel' : 'Add Note'}
        </button>
      </div>
      {ShowNewNote && (
        <div className="AddNote-Wrapper">
          <input
            value={NewNote.title}
            name="title"
            placeholder="new note's title"
            onChange={() => {
              handleInput(event)
            }}
          ></input>
          <textarea
            value={NewNote.text}
            name="text"
            placeholder="new note's title"
            onChange={() => {
              handleInput(event)
            }}
          ></textarea>
        </div>
      )}
      <div className="Note-wrapper">
        {NOTES.length > 0
          ? NOTES.map((note) => {
              const isNoteHovered = hoveredNoteId === note.id ? true : false

              const handleChange = (event) => {
                const { name, value } = event.target
                const targetNote = NOTES.find((oldNote) => {
                  return oldNote.id === note.id
                })
                const Notes = NOTES
                Notes.splice(Notes.indexOf(targetNote), 1)
                targetNote[name] = value
                Notes.unshift(targetNote)
                setUser((prev) => {
                  return { ...prev, Notes }
                })
              }
              return (
                <div
                  onDoubleClick={() => {
                    copyText(note.text, '')
                  }}
                  className="Note"
                  key={note.id}
                  onMouseEnter={() => handleNoteHover(note)}
                  onMouseLeave={handleNoteHoverEnd}
                >
                  {isNoteHovered && (
                    <>
                      <img
                        src="../../icons/copy.png"
                        title="نسخ"
                        onClick={() => {
                          copyText(note.text, 'icon')
                        }}
                        className="Copy  animate__animated  animate__fadeIn"
                      ></img>
                      {note.pinned ? (
                        <img
                          title="الغاء التثبيت"
                          className="Pin  animate__animated  animate__fadeIn"
                          onClick={() => {
                            ChangePin(note)
                          }}
                          src="../../icons/pinFilled.png"
                        ></img>
                      ) : (
                        <img
                          title="تثبيت"
                          className="Pin  animate__animated  animate__fadeIn"
                          onClick={() => {
                            ChangePin(note)
                          }}
                          src="../../icons/pin.png"
                        ></img>
                      )}
                    </>
                  )}
                  <input
                    className="title"
                    name="title"
                    onChange={() => {
                      handleChange(event)
                    }}
                    placeholder="Note's title"
                    value={note.title}
                  ></input>
                  <textarea
                    value={note.text}
                    name="text"
                    onChange={() => {
                      handleChange(event)
                    }}
                  ></textarea>
                  {isNoteHovered && (
                    <div className="button-wrapper  animate__animated  animate__fadeIn">
                      <img
                        title="حفظ"
                        src="../../icons/Save.png"
                        className="Icon"
                        onClick={() => {
                          SaveActiveNote(note)
                        }}
                      />
                      <img
                        title="رفع لاعلي"
                        src="../../icons/up.png"
                        className="Icon"
                        onClick={() => {
                          reOrder(note)
                        }}
                      />
                      <img
                        title="مسح"
                        disabled={deleting ? true : false}
                        src="../../icons/delete.png"
                        className="Icon"
                        onClick={() => {
                          deleteActiveNote(note)
                        }}
                      />
                    </div>
                  )}
                </div>
              )
            })
          : ''}
      </div>
    </div>
  )
}
