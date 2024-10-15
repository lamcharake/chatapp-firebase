import { useEffect, useRef, useState } from 'react'
import EmojiPicker from 'emoji-picker-react'
import { arrayUnion, doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useChatStore } from '../../lib/chatStore'
import { useUserStore } from '../../lib/userStore'
import upload from '../../lib/upload'

const Chat = () => {
  const [chat, setChat] = useState()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [img, setImg] = useState({ file: null, url: '' })

  const { currentUser } = useUserStore()
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } = useChatStore()

  const scroller = useRef()

  useEffect(() => {
    scroller.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [chat?.messages])

  useEffect(() => {
    const unSub = onSnapshot(doc(db, 'chats', chatId), (res) => {
      setChat(res.data())
    })

    return unSub
  }, [chatId])

  const handleEmoji = (e) => {
    setText((prev) => prev + e.emoji)
    setOpen(false)
  }

  const handleImg = (e) => {
    if (e.target.files[0]) setImg({ file: e.target.files[0], url: URL.createObjectURL(e.target.files[0]) })
  }

  const handleSend = async () => {
    if (!text) return

    let imgUrl = null

    try {
      if (img.file) imgUrl = await upload(img.file)

      await updateDoc(doc(db, 'chats', chatId), {
        messages: arrayUnion({
          senderId: currentUser.id,
          text,
          createdAt: new Date(),
          ...(imgUrl && { img: imgUrl })
        })
      })

      const userIDs = [currentUser.id, user.id]

      userIDs.forEach(async (id) => {
        const userChatsRef = doc(db, 'userchats', id)
        const userChatsSnapshot = await getDoc(userChatsRef)

        if (userChatsSnapshot.exists()) {
          const userChatsData = userChatsSnapshot.data()

          const chatIndex = userChatsData.chats.findIndex((c) => c.chatId === chatId)

          userChatsData.chats[chatIndex].lastMessage = text
          userChatsData.chats[chatIndex].isSeen = id === currentUser.id ? true : false
          userChatsData.chats[chatIndex].updatedAt = Date.now()

          await updateDoc(userChatsRef, {
            chats: userChatsData.chats
          })
        }
      })
    } catch (err) {
      console.log(err)
    } finally {
      setImg({
        file: null,
        url: ''
      })

      setText('')
    }
  }

  return (
    <div class='max-h-svh w-full'>
      <div class='flex h-full flex-col'>
        <div class='flex justify-between p-3 items-center bg-gray-700'>
          <div class='flex items-center gap-3 text-lg'>
            <img className='size-16 rounded-full' src={user?.avatar || './avatar.png'} alt='' />
            <div class=''>
              <h1 className='font-bold'>{user?.fullName}</h1>
              <h2>@{user?.username}</h2>
            </div>
          </div>
          <div class=''>
            <img src='./info.png' alt='' />
          </div>
        </div>
        <div class='mb-4 flex h-max flex-col overflow-x-auto space-y-2 p-3'>
          {chat?.messages?.map((message, i) => (
            <div
              style={message.senderId == currentUser.id ? { marginLeft: 'auto' } : {}}
              key={i}
              class='flex items-center'
            >
              <p
                class='p-3 pb-1 flex flex-col bg-violet-500/30 max-w-xs lg:max-w-md rounded-lg'
                style={message.senderId == currentUser.id ? { backgroundColor: '#1D4ED8' } : {}}
              >
                {message.text}
                {message?.img && <img src={message?.img || img.url} alt='' class='w-full object-cover aspect-square' />}
                <time class='ml-auto'>
                  {Intl.DateTimeFormat('en', { hour: 'numeric', minute: 'numeric' }).format(message.createAt?.toDate())}

                  {/* {format(message?.createdAt.toDate())} */}
                </time>
              </p>
            </div>
          ))}
          <div ref={scroller}></div>
        </div>
        {/* <!-- bottom bar  --> */}
        <div class='flex h-16 w-full items-center rounded-xl bg-gray-700 p-2'>
          <div>
            <label class='flex items-center justify-center text-gray-400 hover:text-gray-600'>
              <svg class='h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  stroke-linecap='round'
                  stroke-linejoin='round'
                  stroke-width='2'
                  d='M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13'
                ></path>
              </svg>
              <input type='file' id='file' class='hidden' onChange={handleImg} />
            </label>
          </div>
          <div class='ml-4 flex-grow'>
            <div class='relative w-full'>
              <input
                type='text'
                onKeyDown={(ev) => {
                  if (ev.key === 'Enter') handleSend()
                }}
                class='flex h-10 w-full rounded-xl border pl-4 focus:border-indigo-300 focus:outline-none bg-gray-800'
                placeholder={
                  isCurrentUserBlocked || isReceiverBlocked ? 'You cannot send a message' : 'Type a message...'
                }
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={isCurrentUserBlocked || isReceiverBlocked}
              />
              <button
                onClick={() => setOpen((prev) => !prev)}
                class='absolute right-0 top-0 flex h-full w-12 items-center justify-center text-gray-400 hover:text-gray-600'
              >
                <svg class='h-6 w-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    stroke-linecap='round'
                    stroke-linejoin='round'
                    stroke-width='2'
                    d='M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                  ></path>
                </svg>
              </button>

              <div class='fixed bottom-12 right-1'>
                <EmojiPicker open={open} onEmojiClick={handleEmoji} />
              </div>
            </div>
          </div>

          <div class='ml-4'>
            <button
              class='inline-flex items-center py-2.5 px-3 text-sm font-medium text-white bg-blue-700 rounded-lg border border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800'
              onClick={handleSend}
              disabled={isCurrentUserBlocked || isReceiverBlocked}
            >
              <svg className='size-4 me-2 fill-current' viewBox='0 0 512 512'>
                <path d='M498.1 5.6c10.1 7 15.4 19.1 13.5 31.2l-64 416c-1.5 9.7-7.4 18.2-16 23s-18.9 5.4-28 1.6L284 427.7l-68.5 74.1c-8.9 9.7-22.9 12.9-35.2 8.1S160 493.2 160 480l0-83.6c0-4 1.5-7.8 4.2-10.8L331.8 202.8c5.8-6.3 5.6-16-.4-22s-15.7-6.4-22-.7L106 360.8 17.7 316.6C7.1 311.3 .3 300.7 0 288.9s5.9-22.8 16.1-28.7l448-256c10.7-6.1 23.9-5.5 34 1.4z' />
              </svg>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Chat
