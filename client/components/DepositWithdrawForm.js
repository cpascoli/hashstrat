import React from 'react'
import { Container, Row, Col, Form, Button, InputGroup, ButtonToolbar, ButtonGroup } from 'react-bootstrap'
import { getAllowance, approve } from "../web3/usdc"
import { deposit, withdraw } from "../web3/pool"

export default class DepositWithdrawForm extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            ...props,
            amount: '',
        }
    }

    setAmount = (perc) => {
        const amount = Math.floor(Number(this.state.balance) * perc) / 100
        let isValid = !isNaN(amount) && amount > 0
        this.setState({
            validAmount: isValid,
            amount: isNaN(amount)? '' : amount.toString(),
        })
    }

    updateAmount = (e) => {
        let value = this.parseAmount(e.target.value)
        let isValid = !isNaN(value) && value >= 0

        this.setState({
            validAmount: isValid,
            amount: e.target.value
        })

        if (isValid) {
            this.checkAllowance(value).then(allowanceOk => {
                this.setState({ sufficientAllowance: allowanceOk })
            })
        }
    }

    allowButtonPressed = async () => {
        const amount = Number(this.state.amount)
        approve(amount)
            .then(result => {
                //this.props.handleSuccess(`Allowance increased. Transaction hash: ${result.transactionHash}`)
                return this.checkAllowance(amount)
            }).then(allowanceOk => {
                this.setState({ sufficientAllowance: allowanceOk })
            }).catch(error => {
                const message = this.getError(error)
                console.error('Error approving tokens', message);
                this.props.handleError(error, message)
            })
    }

    checkAllowance = (amount) => {
        return new Promise((resolve, reject) => {
            getAllowance()
                .then((allowance) => {
                    console.log(">> checkAllowance() - allowance:", allowance)
                    const allowanceOk = amount <= allowance
                    resolve(allowanceOk);
                })
                .catch((error) => {
                    console.error('Error checking allowance', error);
                    reject(error)
                })
        })
    }

    submitForm = () => {
        if (this.state.formType === 'deposit') {
            this.submitDeposit()
        } else if (this.state.formType === 'withdraw') {
            this.submitWithdrawal()
        }
    }

    submitDeposit = () => {
        const { amount, sufficientAllowance, validAmount } = this.state

        if (!sufficientAllowance) {
            this.setState({ error: "Insufficient token allowance" })
            return
        }
        if (!validAmount) {
            this.setState({ error: "Invalid token amount" })
            return
        }
        const value = Number(amount)
        
        deposit(value).then(result => {
            this.props.handleSuccess(`Deposit started. Transaction hash: ${result.transactionHash}`)
        }).catch((error) => {
            const message = this.getError(error)
            this.props.handleError(error, message)
        })
    }

    submitWithdrawal = () => {
        const { amount, validAmount } = this.state
        if (!validAmount) {
            this.setState({ error: "Invalid token amount" })
            return
        }
        const value = Number(amount)
        
        withdraw(value).then(result => {
            this.props.handleSuccess(`Withdrawal started. Transaction hash: ${result.transactionHash}`)
        }).catch((error) => {
            const message = this.getError(error)
            this.props.handleError(error, message)
        })
    }

    getError = (error) => {
        switch (true) {
            case error.message.includes('User denied transaction signaturel'): return "User denied transaction signature"
        }

        return error.message
    }

    parseAmount = (amount) => {
        return Math.floor(Number(amount) * 100) / 100
    }

    render() {
        const { formType, balance } = this.state

        const title = (formType === 'deposit') ? "Deposit" : (formType === 'withdraw') ? "Withdraw" : undefined
        if (!title) return (<div>Error</div>)

        return (
            <div>
                <h3 className="text-center">{title}</h3>

                <Form className="p-4">
                    <Form.Group row controlId="stakeAmount">
                       
                        <Form.Label variant="secondary" className="w-100 text-end text-muted" >Balance: {balance}</Form.Label>
                        <InputGroup className="mb-3">
                            <Form.Control
                                type="text" placeholder="0.0" autoComplete="off" value={this.state.amount}
                                title="balance not staked" onChange={e => this.updateAmount(e)}
                            />
                            <InputGroup.Text> USDC </InputGroup.Text>
                        </InputGroup>

                    </Form.Group>
            
                    <Container>
                        <Row >
                           <Col className="m-0 p-2"> <Button onClick={() => this.setAmount(25)} className="w-100" variant="outline-secondary">25%</Button> </Col>
                           <Col className="m-0 p-2"> <Button onClick={() => this.setAmount(50)} className="w-100" variant="outline-secondary">50%</Button> </Col>     
                           <Col className="m-0 p-2"> <Button onClick={() => this.setAmount(75)} className="w-100" variant="outline-secondary">75%</Button> </Col>
                           <Col className="m-0 p-2"> <Button onClick={() => this.setAmount(100)} className="w-100" variant="outline-secondary">Max</Button> </Col>
                        </Row>
                    </Container>

                    <div style={{ textAlign: "center" }} className="mt-4">
                        {this.state.validAmount && !this.state.sufficientAllowance && this.state.formType === 'deposit' &&
                            <Button name="allow" type="button" variant="primary w-50"
                                onClick={e => this.allowButtonPressed()} className="pl-2">
                                Allow USDC token transfer
                            </Button>
                        }
                        &nbsp;&nbsp;&nbsp;
                        {<Button variant="primary w-25" onClick={this.submitForm}
                            disabled={!(this.state.validAmount && (this.state.formType === 'withdraw' || this.state.sufficientAllowance))}>
                            {title}
                        </Button>
                        }
                    </div>
                </Form>
            </div>
        )

    }
}