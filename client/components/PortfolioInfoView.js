import { Form, Container, Card, Row, Col } from 'react-bootstrap'
import {  Wrapped } from "../components/Layout"


const PortfolioInfoView = ({ deposited, withdrawn, portfolioValue, depositTokenSymbol }) => { 
  const roi =  Math.round( 10000 * (withdrawn + portfolioValue - deposited) / deposited ) / 100;
  const roiFormatted = roi ? `${roi} %` : "n/a"

  return (

    <Wrapped>
      <Card style={{flex: 1, minWidth:200, margin: 10 }}>
        <Card.Title className="p-2">My Deposits (Cumulative)</Card.Title>
        <Card.Body> { deposited } {depositTokenSymbol} </Card.Body>
      </Card>
      <Card style={{flex: 1, minWidth:200, margin: 10 }}>
        <Card.Title className="p-2">MY Withdrawals (Cumulative)</Card.Title>
        <Card.Body> { withdrawn }  {depositTokenSymbol} </Card.Body>
      </Card>

      <Card style={{flex: 1, minWidth:200, margin: 10 }}>
        <Card.Title className="p-2">My Portfolio Value</Card.Title>
        <Card.Body> { portfolioValue }  {depositTokenSymbol} </Card.Body>
      </Card>

      <Card style={{flex: 1, minWidth:200, margin: 10 }}>
        <Card.Title className="p-2">My ROI</Card.Title>
        <Card.Body> { roiFormatted } </Card.Body>
      </Card>

  </Wrapped>
)}

export default PortfolioInfoView;