import React from 'react'
import { GETCOLLECTION, SETDOC } from '../../background'
import { CreateToast } from './App'
export default function Main(props) {
  const [LoggedInUser, setLoggedInUser] = React.useState({
    UserName: '',
    Password: '',
  })

  const [showPassword, setShowPassword] = React.useState(false)
  const handleChange = (e) => {
    setShowPassword((prev) => !prev)
  }
  const handleInput = (event) => {
    const { name, value } = event.target
    setLoggedInUser((prev) => {
      return {
        ...prev,
        [name]: value,
      }
    })
  }
  const handleLogin = async (e) => {
    e.preventDefault()
    if (!LoggedInUser.UserName) {
      return
    } else {
      const oldUsers = await GETCOLLECTION('Users')
      const MatchUsername = oldUsers.find((user) => {
        return user.UserName === LoggedInUser.UserName
      })
      if (MatchUsername) {
        const currentDate = new Date()
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth() + 1
        const day = currentDate.getDate()
        const hours = currentDate.getHours()
        const minutes = currentDate.getMinutes()
        const seconds = currentDate.getSeconds()
        const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`

        if (MatchUsername.Password === LoggedInUser.Password) {
          localStorage.setItem('ActiveUser', JSON.stringify(MatchUsername))
          chrome.storage.local.set({ Notes: MatchUsername.Notes })
          localStorage.setItem('LoginTime', JSON.stringify(formattedDate))

          localStorage.setItem('InsertText', JSON.stringify(true))
          localStorage.setItem('BreakTimer', false)
          localStorage.setItem('AdvancedMode', true)
          chrome.storage.local.set({ AdvancedMode: true })
          props.setActivePage('APP')
          await SETDOC('Users', MatchUsername.ID, {
            ...MatchUsername,
            LastUpdate: formattedDate,
          })
        } else {
          CreateToast('كلمة مرور خاطئة', 'error')
        }
      } else {
        CreateToast('لا يوجد مستخدم', 'error')
      }
    }
  }

  return (
    <form className="Form" onSubmit={handleLogin}>
      <h1 style={{ textAlign: 'center' }}>Login</h1>
      <div className="formItem">
        <label htmlFor="username">Username:</label>
        <input
          className="Input"
          type="text"
          Name="UserName"
          id="username"
          value={LoggedInUser.UserName}
          onChange={() => {
            handleInput(event)
          }}
        />
      </div>
      <div className="formItem">
        <label htmlFor="password">Password:</label>
        <input
          className="Input"
          type={showPassword ? 'text' : 'password'}
          id="password"
          name="Password"
          value={LoggedInUser.Password}
          onChange={() => {
            handleInput(event)
          }}
        />
      </div>
      <div className="CheckWrapper" style={{ marginBottom: '70px' }}>
        <label>
          <input
            type="checkbox"
            checked={showPassword}
            onChange={handleChange}
          />
          Show Password
        </label>
      </div>
      <div className="button-wrapper">
        <button className="bn632-hover bn24">Login</button>
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
