import styles from './style-probe.module.css';

// Plain host-owned elements, so AEM's global CSS has something to restyle (Step 4c).
// Compare screenshots with AEM's stylesheets on and off.
export default function StyleProbePage() {
  return (
    <>
      <h1>Heading 1</h1>
      <h2>Heading 2</h2>
      <h3>Heading 3</h3>
      <p>
        A paragraph with a <a href="#probe">link</a> and <strong>bold</strong> text.
      </p>
      <button type="button">Button</button>
      <label>
        Input <input type="text" defaultValue="value" />
      </label>
      <ul>
        <li>List item one</li>
        <li>List item two</li>
      </ul>
      <table>
        <thead>
          <tr>
            <th>Size</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>225/45R17</td>
            <td>$150</td>
          </tr>
        </tbody>
      </table>
      <div className={styles.probe} id="probe">
        CSS-module box
      </div>
    </>
  );
}
