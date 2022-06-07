import { Form, Container, Card, Row, Col } from 'react-bootstrap'
import {  Wrapped } from "../components/Layout"


const PortfolioInfoView = ({ deposited, withdrawn, portfolioValue, depositTokenSymbol }) => { 
  const roi =  Math.round( 10000 * (withdrawn + portfolioValue) / deposited ) / 100;
  
  return (

    <Wrapped>
      <Card style={{flex: 1, minWidth:200, margin: 10 }}>
        <Card.Title className="p-2">Deposited</Card.Title>
        <Card.Body> { deposited } {depositTokenSymbol} </Card.Body>
      </Card>
      <Card style={{flex: 1, minWidth:200, margin: 10 }}>
        <Card.Title className="p-2">Withdrawn</Card.Title>
        <Card.Body> { withdrawn }  {depositTokenSymbol} </Card.Body>
      </Card>

      <Card style={{flex: 1, minWidth:200, margin: 10 }}>
        <Card.Title className="p-2">My Portfolio Value</Card.Title>
        <Card.Body> { portfolioValue }  {depositTokenSymbol} </Card.Body>
      </Card>

      <Card style={{flex: 1, minWidth:200, margin: 10 }}>
        <Card.Title className="p-2"> ROI</Card.Title>
        <Card.Body> { roi } % </Card.Body>
      </Card>

  </Wrapped>
)}

export default PortfolioInfoView;