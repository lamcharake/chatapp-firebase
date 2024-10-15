import { useEffect } from 'react'
import Chat from './components/chat/Chat'
import List from './components/list/List'
import Login from './components/login/Login'
import Notification from './components/notification/Notification'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './lib/firebase'
import { useUserStore } from './lib/userStore'
import { useChatStore } from './lib/chatStore'

export default function App() {
  const { currentUser, isLoading, fetchUserInfo } = useUserStore()
  const { chatId } = useChatStore()

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => fetchUserInfo(user?.uid))
  }, [fetchUserInfo])

  if (isLoading)
    return (
      <div class='flex h-svh items-center justify-center bg-current'>
        <div class='py-2 text-blue-700'>
          <svg class='w-12 animate-spin' fill='none' viewBox='0 0 24 24'>
            <circle class='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' stroke-width='4'></circle>
            <path
              class='opacity-75'
              fill='currentColor'
              d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
            ></path>
          </svg>
        </div>
      </div>
    )

  return (
    <div className='h-svh bg-gray-800 text-white flex'>
      {currentUser ? (
        <>
          <List />
          {chatId && <Chat />}
          {/* {chatId && <Detail />} */}
        </>
      ) : (
        <Login />
      )}
      <Notification />
    </div>
  )
}
