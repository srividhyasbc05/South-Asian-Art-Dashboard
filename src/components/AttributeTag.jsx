import './AttributeTag.css'

const AttributeTag= ({ label, value, isBanned, onClick })=> {
  return (
     <div
      className={`attribute-tag ${isBanned ? "attribute-tag--banned" : ""}`}
      onClick={() => onClick(value)}
      // title shows a tooltip on hover explaining what the click does
      title={isBanned ? "Click to remove from ban list" : "Click to ban this attribute"}
    >
      {/* The label is small text above the value, e.g. "Artist" */}
      <span className="attribute-tag__label">{label}</span>
 
      {/* The value is the main text, e.g. "Raja Ravi Varma" */}
      <span className="attribute-tag__value">{value}</span>
    </div>
  );
}
 

export default AttributeTag