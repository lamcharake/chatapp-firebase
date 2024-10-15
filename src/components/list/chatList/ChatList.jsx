import { useEffect, useState } from 'react'
import AddUser from './addUser/addUser'
import { useUserStore } from '../../../lib/userStore'
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore'
import { db } from '../../../lib/firebase'
import { useChatStore } from '../../../lib/chatStore'
import { format } from 'timeago.js'

const ChatList = () => {
  const [chats, setChats] = useState([])
  const [addMode, setAddMode] = useState(false)

  const { currentUser } = useUserStore()
  const { chatId, changeChat } = useChatStore()

  useEffect(() => {
    const unSub = onSnapshot(doc(db, 'userchats', currentUser.id), async (res) => {
      const items = res.data()?.chats

      const promises = items?.map(async (item) => {
        const userDocRef = doc(db, 'users', item.receiverId)
        const userDocSnap = await getDoc(userDocRef)

        const user = userDocSnap.data()

        return { ...item, user }
      })

      const chatData = await Promise.all(promises)

      setChats(chatData.sort((a, b) => b.updatedAt - a.updatedAt))
    })

    return unSub
  }, [currentUser?.id])

  const handleSelect = async (chat) => {
    const userChats = chats.map((item) => {
      const { user, ...rest } = item
      return rest
    })

    const chatIndex = userChats.findIndex((item) => item.chatId === chat.chatId)

    userChats[chatIndex].isSeen = true

    const userChatsRef = doc(db, 'userchats', currentUser.id)

    try {
      await updateDoc(userChatsRef, { chats: userChats })
      changeChat(chat.chatId, chat.user)
    } catch (err) {
      console.log(err)
    }
  }

  return (
    <div className='p-2 shrink-0'>
      <button
        class='mb-2 inline-flex items-center py-2.5 px-3 text-sm font-medium text-white bg-blue-700 rounded-lg border border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800'
        onClick={() => setAddMode((prev) => !prev)}
      >
        <svg class='w-4 h-4 me-2' fill='none' viewBox='0 0 20 20'>
          <path
            stroke='currentColor'
            stroke-linecap='round'
            stroke-linejoin='round'
            stroke-width='2'
            d='m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z'
          />
        </svg>
        Search
      </button>

      {chats.map((chat) => (
        <div
          className='flex gap-4 py-3 items-center cursor-pointer bg-gray-600/45 rounded-lg'
          key={chat.chatId}
          onClick={() => handleSelect(chat)}
          style={{ backgroundColor: !chat?.isSeen && '#5183fe' }}
        >
          <img
            class='size-16 object-cover object-center rounded-full overflow-hidden'
            src={chat.user.blocked.includes(currentUser.id) ? './avatar.png' : chat.user.avatar || './avatar.png'}
            alt=''
          />
          <div>
            <span className='capitalize font-bold text-lg'>
              {chat.user.blocked.includes(currentUser.id) ? 'User' : chat.user.fullName}
            </span>
            <p className='text-base font-normal'>{chat.lastMessage}</p>
            <span>
              {Intl.DateTimeFormat('en', { hour: 'numeric', minute: 'numeric' }).format(new Date(chat.updatedAt))}
            </span>
          </div>
        </div>
      ))}

      {addMode && <AddUser />}
    </div>
  )
}

export default ChatList
