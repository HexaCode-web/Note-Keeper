import React from 'react'
import { GETCOLLECTION, QUERY, SETDOC } from '../../background'
import { CreateToast } from './App'
import sortBy from 'sort-by'
import CustomInput from '../Input/CustomInput'
export default function Main(props) {
  const [NewUser, setNewUser] = React.useState({
    UserName: '',
    Password: '',
    Notes: [],
  })

  const [showPassword, setShowPassword] = React.useState(false)
  const handleChange = (e) => {
    setShowPassword((prev) => !prev)
  }
  const handleInput = (event) => {
    const { name, value } = event.target
    setNewUser((prev) => {
      return {
        ...prev,
        [name]: value,
      }
    })
  }
  const handleSignup = async (e) => {
    if (NewUser.UserName === '' || NewUser.Password === '') {
      CreateToast('اسم المستخدم و كلمة المرور مطلوبين', 'error', 2000)
      return
    }
    e.preventDefault()
    let Matches = await QUERY('Users', 'UserName', '==', NewUser.UserName)
    if (Matches.length > 0) {
      CreateToast('يوجد مستخدم بنفس الاسم', 'error', 2000)
      return
    }
    let oldUsers = await GETCOLLECTION('Users')
    let localID
    oldUsers.sort(sortBy('ID'))
    oldUsers.forEach((user) => {
      localID = +user.ID + 1
    })
    const currentDate = new Date()
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth() + 1
    const day = currentDate.getDate()
    const hours = currentDate.getHours()
    const minutes = currentDate.getMinutes()
    const seconds = currentDate.getSeconds()
    const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    localStorage.setItem(
      'ActiveUser',
      JSON.stringify({ ...NewUser, ID: localID }),
    )
    chrome.storage.local.set({ Notes: NewUser.Notes })

    localStorage.setItem('InsertText', JSON.stringify(true))
    localStorage.setItem('AdvancedMode', false)
    chrome.storage.local.set({ AdvancedMode: false })
    await SETDOC(
      'Users',
      localID,
      { ...NewUser, ID: localID, LastUpdate: formattedDate },
      true,
    )
    props.setActivePage('APP')

    CreateToast('تم اضافة الحساب', 'success', 2000)
  }
  return (
    <form className="Form" onSubmit={handleSignup}>
      <h1 style={{ textAlign: 'center' }}>Sign up</h1>
      <CustomInput
        label="username"
        type="text"
        name="UserName"
        value={NewUser.UserName}
        onChangeFunction={handleInput}
      />

      <CustomInput
        label="Password:"
        type="password"
        name="Password"
        value={NewUser.Password}
        onChangeFunction={handleInput}
      />
      <div className="button-wrapper">
        <button
          className="bn632-hover bn24"
          onClick={handleSignup}
          style={{ minWidth: '105px' }}
        >
          Sign up
        </button>
        <button
          class="bn632-hover bn28"
          onClick={() => {
            props.setActivePage('welcome')
          }}
        >
          Return
        </button>
      </div>
    </form>
  )
}
