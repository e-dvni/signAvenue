const Signup = () => {
  return (
    <section>
      <h1>Create an Account</h1>
      <p>Later this will create a user in the Rails API.</p>
      <form>
        <div>
          <label>
            Name<br />
            <input type="text" />
          </label>
        </div>
        <div>
          <label>
            Email<br />
            <input type="email" />
          </label>
        </div>
        <div>
          <label>
            Password<br />
            <input type="password" />
          </label>
        </div>
        <button type="submit">Sign Up</button>
      </form>
    </section>
  )
}

export default Signup
