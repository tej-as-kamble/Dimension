import './postdetail.css'
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { MdOutlineSentimentSatisfied } from "react-icons/md";
import { IoMdClose } from "react-icons/io";

const Postdetail = ({ item, toogledetail }) => {
  const navigate = useNavigate();
  const notifyA = (val) => toast.error(val)
  const notifyB = (val) => toast.success(val)
  const piclink = "https://cdn-icons-png.flaticon.com/128/552/552721.png";

  const removepost = (postid) => {
    if (window.confirm("Are you sure want to delete this post?")) {
      fetch(`${import.meta.env.VITE_BACKEND_URL}/deletepost/${postid}`, {
        method: "delete",
        headers: {
          "Authorization": "Bearer " + localStorage.getItem('jwt')
        }
      }).then((res) => {
        return res.json()
      }).then((result) => {
        notifyB(result.message)
        toogledetail();
        navigate('/')
      }).catch((err) => {
        notifyA(err.error)
      })
    }

  }

  return (
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
              <div className="name-del-line" ></div>
              <div className="deletepost">
                <span className="material-symbols-outlined" onClick={() => { removepost(item._id) }}>delete</span>
              </div>
            </div>
            <div className="close-comment" onClick={() => { toogledetail() }}><IoMdClose color='black' /></div>
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
            <input type="text" placeholder='Add a comment' />
            <button className='comment'  >Post</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Postdetail