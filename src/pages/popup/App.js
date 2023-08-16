import React, { useEffect } from 'react'
import './styles.css'
import Main from './Main'
import LOGIN from './Login'
import SIGNUP from './Signup'
import { ToastContainer, toast } from 'react-toastify'
import './toast.css'
import 'react-toastify/dist/ReactToastify.css'
export const CreateToast = (text, type, duration = 2000) => {
  let value
  switch (type) {
    case 'success':
      value = toast.success
      break
    case 'info':
      value = toast.info
      break
    case 'warning':
      value = toast.warning
      break
    case 'error':
      value = toast.error
      break
    default:
      value = toast
      break
  }
  return value(text, {
    position: 'bottom-right',
    autoClose: duration,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: 'dark',
  })
}
const App = () => {
  const [IsLoggedIn, setIsLoggedIn] = React.useState(
    JSON.parse(localStorage.getItem('ActiveUser')) || false,
  )
  const [ActivePage, setActivePage] = React.useState('welcome')
  useEffect(() => {
    setIsLoggedIn(JSON.parse(localStorage.getItem('ActiveUser')))
  }, [])
  return (
    <>
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      {IsLoggedIn ? (
        <Main />
      ) : (
        <div style={{ width: '100%' }}>
          {ActivePage === 'welcome' ? (
            <div className="loginPage">
              <div
                className="bn632-hover bn24"
                onClick={() => {
                  setActivePage('LOGIN')
                }}
              >
                login
              </div>
              <div
                className="bn632-hover bn23"
                onClick={() => {
                  setActivePage('SIGNUP')
                }}
              >
                Signup
              </div>
            </div>
          ) : (
            ''
          )}
          {ActivePage === 'APP' ? <Main /> : ''}
          {ActivePage === 'LOGIN' ? (
            <LOGIN setActivePage={setActivePage} />
          ) : (
            ''
          )}
          {ActivePage === 'SIGNUP' ? (
            <SIGNUP setActivePage={setActivePage} />
          ) : (
            ''
          )}
        </div>
      )}
    </>
  )
}
export default App
