import { useState, useEffect } from 'react'
import './createpost.css'
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const Createpost = () => {
  const navigate = useNavigate();
  const [body, setbody] = useState("");
  const [image, setimage] = useState();
  const [url, seturl] = useState("");
  const notifyA = (val) => toast.error(val)
  const notifyB = (val) => toast.success(val)
  const piclink = "https://cdn-icons-png.flaticon.com/128/552/552721.png";

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  useEffect(() => {
    if (url) {
      fetch(`${import.meta.env.VITE_BACKEND_URL}/createpost`, {
        method: "post",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + localStorage.getItem("jwt")
        },
        body: JSON.stringify({
          body: body, photo: url
        })
      }).then((res) => {
        return res.json();
      }).then((data) => {
        if (data.error) {
          notifyA(data.error)
        }
        else {
          notifyB("Successfully Posted")
          navigate("/")
        }
      }).catch((err) => {
        console.log("error occur2")
      })
    }

  }, [url])

  function postdetail() {
    const data = new FormData()
    data.append("file", image)
    data.append("upload_preset", uploadPreset)
    data.append("cloud_name", cloudName)
    fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "post",
      body: data
    }).then((res) => {
      return res.json();
    }).then((val) => {
      seturl(val.url)
    }).catch((err) => {
      console.log("error occur1", err);
    })
  }

  const loadfile = function (event) {
    var reader = new FileReader();
    reader.onload = function () {
      var output = document.getElementById('output');
      output.src = reader.result;
    };
    reader.readAsDataURL(event.target.files[0]);
  };


  return (
    <div className='createpost'>
      <div className="post-header">
        <h4 style={{ margin: "3px auto" }}>Create New Post</h4>
        <button id='post-btn' onClick={postdetail}>Share</button>
      </div>

      <div className="main-div">
        <img src='https://cdn4.iconfinder.com/data/icons/ionicons/512/icon-image-512.png' id="output" />
        <input type="file" accept='image/*' onChange={(event) => { loadfile(event); setimage(event.target.files[0]) }} />
      </div>

      <div className="details">
        <div className="card-header">
          <div className="card-pic">
            <img src={JSON.parse(localStorage.getItem('detail')).photo || piclink} alt="" />
            <h5>{JSON.parse(localStorage.getItem('detail')).name}</h5>
          </div>
        </div>
        <input type="text" className='textarea' placeholder='Write a Caption...' value={body} onChange={(e) => { setbody(e.target.value) }} />
      </div>

    </div>
  )
}

export default Createpost