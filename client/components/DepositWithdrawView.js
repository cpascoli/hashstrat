import React from 'react'
import { Button, Container, Row, Col } from 'react-bootstrap'
import { Center, Wrapped} from "../components/Layout"

import TitleValueBox from './TitleValueBox'

import DepositWithdrawForm from './DepositWithdrawForm'
import Modal from "./Modal"


export default class DepositWithdrawView extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      ...props,
      showUpdateStakeModal: false,
    }
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.balanceUSDC !== this.props.balanceUSDC ||
      prevProps.portfolioValue !== this.props.portfolioValue 
    ) {
      this.setState({
        balanceUSDC: this.props.balanceUSDC,
        portfolioValue: this.props.portfolioValue,
      })
    }
  }



  showModalPreseed = (buttonType) => {
    this.setState({
      showUpdateStakeModal: true,
      formType: buttonType
    })
  }

  hideModalPreseed = () => {
    this.setState({
      showUpdateStakeModal: false,
      formType: undefined
    })
  }

  handleAllowanceUpdated = () => {
    this.props.allowanceUpdated()
  }

  handleSuccess = (result) => {
    this.hideModalPreseed()
    this.props.handleSuccess(result)
  }

  handleError = (error, message) => {
    this.hideModalPreseed()
    this.props.handleError(error, message)
  }


  render() {

    const { showUpdateStakeModal, formType, balanceUSDC, portfolioValue } = this.state

    return (
      <div>

        <div className="mt-4"></div>
        
        <Center maxWidth="500">

          <TitleValueBox title="Available to deposit" value={balanceUSDC} symbol="USDCP" />

          <div className="mt-4"></div>

          <Container>
            <Row>
              <Col>
                <Button name="stake" className="w-100" variant="primary" onClick={(e) => this.showModalPreseed("deposit")}>Deposit</Button>
              </Col>
              <Col>
                <Button name="unstake" className="w-100" variant="secondary" onClick={(e) => this.showModalPreseed("withdraw")}>Withdraw</Button>
              </Col>
            </Row>
          </Container>

          <div className="mt-4"></div>

          {/* <RewardsInfo rewardRate={rewardRate} totalRewardsPaid={totalRewardsPaid} /> */}

          <div className="mt-4"></div>

          {showUpdateStakeModal && (
            <Modal onClose={(e) => this.hideModalPreseed()}>
              <DepositWithdrawForm 
                formType={formType}
                handleSuccess={(result) => this.handleSuccess(result)}
                handleError={(error, message) => this.handleError(error, message)}
                allowanceUpdated={() => this.handleAllowanceUpdated()}
                balance={formType == "deposit" ? balanceUSDC : formType == "withdraw" ? portfolioValue : 0}
              />
            </Modal>
          )}

        </Center>

      </div>
    )
  }
}