import './home.css'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify';
import { useNavigate, Link } from 'react-router-dom'
import { FaRegHeart } from "react-icons/fa";
import { FaHeart } from "react-icons/fa";
import { MdOutlineSentimentSatisfied } from "react-icons/md";
import { IoMdClose } from "react-icons/io";
import { HiOutlineDotsHorizontal } from "react-icons/hi";

const Home = () => {
  const piclink = "https://cdn-icons-png.flaticon.com/128/552/552721.png";
  const [data, setdata] = useState([])
  const [comment, setcomment] = useState("")
  const [show, setshow] = useState(false)
  const [item, setitem] = useState([])
  const notifyA = (val) => toast.error(val)
  const notifyB = (val) => toast.success(val)
  const navigate = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem('jwt');
    if (!token) {
      navigate('./signup')
      return;
    }

    // fetch post 
    fetch(`${import.meta.env.VITE_BACKEND_URL}/allpost`, {
      headers: {
        "Authorization": "Bearer " + localStorage.getItem('jwt')
      }
    }).then((res) => {
      return res.json();
    }).then((result) => {
      setdata(result)
    }).catch((err) => {
      console.log(err)
    })

  }, [])


  const tooglecomment = (post) => {
    if (show) {
      setshow(false)
    }
    else {
      setitem(post)
      setshow(true)
      console.log(item);
    }
  }
  const likepost = (id) => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/like`, {
      method: "put",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + localStorage.getItem('jwt')
      },
      body: JSON.stringify({
        postid: id
      })
    }).then((res) => {
      return res.json();
    }).then((val) => {
      const newdata = data.map((posts) => {
        if (posts._id == val._id) {
          return val
        }
        else {
          return posts;
        }
      })
      setdata(newdata)
    }).catch((err) => {
      console.log(err)
    })
  }
  const unlikepost = (id) => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/unlike`, {
      method: "put",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + localStorage.getItem('jwt')
      },
      body: JSON.stringify({
        postid: id
      })
    }).then((res) => {
      return res.json();
    }).then((val) => {
      const newdata = data.map((posts) => {
        if (posts._id == val._id) {
          return val;

        }
        else {
          return posts;
        }
      })
      setdata(newdata)
    }).catch((err) => {
      console.log(err)
    })
  }

  const makecomment = (val, id) => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/comment`, {
      method: "put",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + localStorage.getItem('jwt')
      },
      body: JSON.stringify({
        text: val,
        postid: id
      })
    }).then((res) => {
      return res.json();
    }).then((val) => {
      const newdata = data.map((posts) => {
        if (posts._id == val._id) {

          return val;

        }
        else {
          return posts;
        }
      })
      setdata(newdata)
      setcomment("")
      notifyB("Comment Posted")
    }).catch((err) => {
      notifyA("Error occur")

    })
  }
  return (
    <div className='home'>
      {/* card  */}
      {
        data.map((post, key) => {
          console.log(post);
          return (
            <div className="card">
              {/* card header  */}
              <div className="card-header">
                <div className="card-pic">
                  <Link to={`/user/${post.postedby._id}`}>
                    <img src={post.postedby.photo || piclink} alt="" />
                  </Link>
                  <h5><Link to={`/user/${post.postedby._id}`}>{post.postedby.username}</Link></h5>
                </div>
                <div className="close-comment"><HiOutlineDotsHorizontal /></div>
              </div>

              {/*card-image */}
              <div className="card-image">
                <img src={post.photo} alt="" />
              </div>
              {/*card content */}
              <div className="card-content">
                {
                  post.likes.includes(JSON.parse(localStorage.getItem("detail"))._id) ?
                    (
                      <div class="like-count material-symbols-outlined" onClick={() => { unlikepost(post._id) }}>
                        <FaHeart color='red' />
                        <p>{post.likes.length} Likes</p>
                      </div>
                    ) : (
                      <div class="like-count material-symbols-outlined" onClick={() => { likepost(post._id) }}>
                        <FaRegHeart color='red' />
                        <p>{post.likes.length} Likes</p>
                      </div>
                    )
                }
                <p>{post.body}</p>
                <p style={{ fontWeight: "bold", cursor: "pointer" }} onClick={() => { tooglecomment(post) }}>View all comments</p>
              </div>
              {/*card comment  */}
              <div className="add-comment">
                <span className="material-symbols-outlined"><MdOutlineSentimentSatisfied /></span>
                <input type="text" placeholder='Add a comment' value={comment} onChange={(e) => { setcomment(e.target.value) }} />
                <button className='comment' onClick={() => (makecomment(comment, post._id))}>Post</button>
              </div>

            </div>
          )
        })
      }

      {/*show comment */}

      {
        show && (
          <div className="show-Comment">
            <div className="container">
              <div className="postPic">
                <img src={item.photo} alt="" />
              </div>
              <div className="details">
                <div className="card-header" style={{ borderBottom: "1px solid #00000029" }}>
                  <div className="card-pic">
                    <img src={item.postedby.photo || piclink} alt="" />
                    <h5>{item.postedby.name}</h5>
                  </div>
                  <div className="close-comment" onClick={() => { tooglecomment() }}><IoMdClose color='black' /></div>
                </div>
                {/* comment-section */}
                <div className="commentsection" style={{ borderBottom: "1px solid #00000029" }}>
                  {
                    item.comments.map((c, k) => {
                      return (
                        <p className="comm">
                          <span className="commenter" style={{ fontWeight: "bolder" }}>{c.postedby.name} </span>
                          <span className="commentText">{c.comment}</span>
                        </p>
                      )
                    })
                  }

                </div>
                <div className="card-content">
                  <p>{item.likes.length} Likes</p>
                  <p>{item.body}</p>
                </div>
                {/*add-comment*/}
                <div className="add-comment">
                  <span className="material-symbols-outlined"><MdOutlineSentimentSatisfied /></span>
                  <input type="text" placeholder='Add a comment' value={comment} onChange={(e) => { setcomment(e.target.value) }} />
                  <button className='comment' onClick={() => (makecomment(comment, item._id), tooglecomment())} >Post</button>
                </div>
              </div>
            </div>
          </div>
        )
      }

    </div>
  )
}

export default Home