import React, { useEffect, useState } from 'react'
import './input.css'

const CustomInput = ({
  textarea,
  label,
  type,
  customClass,
  value,
  onChangeFunction,
  required,
  name,
  id,
  customWidth,
  startWithContent,
}) => {
  const [showPassword, setShowPassword] = useState(false)
  useEffect(() => {
    const input = document.getElementById(name)
    const label = document.querySelector(`label[for=${name}]`)

    const handleFocus = () => {
      label.classList.add('focused-label')
    }

    const handleBlur = () => {
      if (input.value === '') {
        label.classList.remove('focused-label')
      }
    }

    input.addEventListener('focus', handleFocus)
    input.addEventListener('blur', handleBlur)

    // Cleanup the event listeners when the component unmounts
    return () => {
      input.removeEventListener('focus', handleFocus)
      input.removeEventListener('blur', handleBlur)
    }

    // Include input and label in the dependency array
  }, [])
  return (
    <div
      className={`form-group ${textarea ? 'textarea' : ''}`}
      style={{ width: customWidth ? customWidth : '' }}
    >
      {textarea ? (
        <textarea
          className={`${customClass ? customClass : ''} input-lg`}
          value={value}
          name={name}
          id={id ? id : name}
          required={required}
          onChange={onChangeFunction}
        ></textarea>
      ) : (
        <div>
          <input
            type={
              type === 'password'
                ? showPassword === false
                  ? 'password'
                  : 'text'
                : type
            }
            className={`${customClass ? customClass : ''} input-lg`}
            value={value}
            style={{
              width: type === 'password' ? '80%' : '100%',
            }}
            name={name}
            id={id ? id : name}
            required={required}
            onChange={onChangeFunction}
          />
          {type === 'password' && (
            <img
              src={'../../icons/showPassword.png'}
              className="Icon"
              onClick={() => {
                setShowPassword((prev) => !prev)
              }}
            />
          )}
        </div>
      )}

      <label className={`label ${value ? 'focused-label' : ''}`} htmlFor={name}>
        {label}
      </label>
    </div>
  )
}

export default CustomInput
